/**
 * sync-tokens.ts
 *
 * Fetches all Figma native Variables from the Origin Design System file
 * via the Figma Console MCP Desktop Bridge (localhost WebSocket) and writes
 * them as W3C Design Tokens JSON into the tokens/ directory.
 *
 * This approach works with any Figma license tier — it uses the plugin API
 * via the Desktop Bridge rather than the REST API (which requires file_variables:read,
 * a scope only available on Enterprise plans).
 *
 * Prerequisites:
 *   - Figma desktop app open with the "Origin Design System" file
 *   - Figma Console MCP Desktop Bridge plugin running in that file
 *
 * Usage:
 *   pnpm sync-tokens
 *
 * The bridge port is auto-detected (tries 9223 then 9224).
 */

import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { WebSocket } from "ws";

// ─── Bridge connection ────────────────────────────────────────────────────────

const BRIDGE_PORTS = [9223, 9224, 9225];

async function findBridgePort(): Promise<number> {
  for (const port of BRIDGE_PORTS) {
    try {
      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:${port}`);
        ws.once("open", () => { ws.close(); resolve(); });
        ws.once("error", reject);
        setTimeout(() => reject(new Error("timeout")), 1000);
      });
      return port;
    } catch {
      continue;
    }
  }
  throw new Error(
    "Could not connect to Figma Desktop Bridge. " +
    "Make sure the Figma Console MCP plugin is running in your Figma file."
  );
}

async function executeInFigma(port: number, code: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Figma execute timed out after 30s"));
    }, 30000);

    ws.once("open", () => {
      ws.send(JSON.stringify({ type: "execute", code }));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString()) as { type?: string; result?: unknown; error?: string };
        if (msg.type === "result" || msg.result !== undefined) {
          clearTimeout(timeout);
          ws.close();
          resolve(msg.result);
        } else if (msg.type === "error" || msg.error) {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(msg.error ?? "Unknown Figma execute error"));
        }
      } catch {
        // ignore non-JSON messages
      }
    });

    ws.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ─── Token extraction code (runs inside Figma plugin sandbox) ─────────────────

const EXTRACTION_CODE = `
(async () => {
  const allVars = await figma.variables.getLocalVariablesAsync();
  const varMap = Object.fromEntries(allVars.map(v => [v.id, v]));

  function rgbaToHex(c) {
    const r=Math.round((c.r??0)*255),g=Math.round((c.g??0)*255),b=Math.round((c.b??0)*255),a=c.a??1;
    const h=v=>v.toString(16).padStart(2,'0');
    return a<1 ? \`#\${h(r)}\${h(g)}\${h(b)}\${Math.round(a*255).toString(16).padStart(2,'0')}\` : \`#\${h(r)}\${h(g)}\${h(b)}\`;
  }

  function toW3C(variable, value) {
    if (value?.type === 'VARIABLE_ALIAS') {
      const ref = varMap[value.id];
      if (ref) return { ${'$'}value: \`{\${ref.name.split('/').map(p=>p.trim().toLowerCase().replace(/\\s+/g,'-')).join('.')}}\` };
    }
    if (variable.resolvedType === 'COLOR') return { ${'$'}type: 'color', ${'$'}value: rgbaToHex(value) };
    if (variable.resolvedType === 'FLOAT') {
      const n = variable.name.toLowerCase();
      if (n.includes('letter-spacing')) return { ${'$'}type: 'number', ${'$'}value: value };
      if (n.includes('space')||n.includes('size')||n.includes('radius')||n.includes('border-width')||n.includes('font-size')||n.includes('line-height'))
        return { ${'$'}type: 'dimension', ${'$'}value: \`\${value}px\` };
      return { ${'$'}type: 'number', ${'$'}value: value };
    }
    if (variable.resolvedType === 'STRING') return { ${'$'}type: 'string', ${'$'}value: value };
    return { ${'$'}value: String(value) };
  }

  function setNested(obj, parts, value) {
    let cur = obj;
    for (let i=0; i<parts.length-1; i++) { const k=parts[i]; if (typeof cur[k]!=='object') cur[k]={}; cur=cur[k]; }
    cur[parts[parts.length-1]] = value;
  }

  function extract(colId, modeId) {
    const result = {};
    for (const v of allVars) {
      if (v.remote || v.variableCollectionId !== colId) continue;
      const val = v.valuesByMode[modeId];
      if (val === undefined) continue;
      const token = toW3C(v, val);
      if (v.description) token.${'$'}description = v.description;
      setNested(result, v.name.split('/').map(p=>p.trim().toLowerCase().replace(/\\s+/g,'-')), token);
    }
    return result;
  }

  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const result = {};

  for (const col of collections) {
    if (col.remote || col.name.startsWith('_')) continue;
    const n = col.name.toLowerCase();
    const isSingle = col.modes.length === 1;

    for (const mode of col.modes) {
      let dir, fileKey;
      const modeSuffix = isSingle ? '' : '.' + mode.name.toLowerCase();

      if (n.includes('t1') || n.includes('primitive')) {
        dir = 'primitive';
        if (n.includes('color')) fileKey = 'color';
        else if (n.includes('typography')) fileKey = 'typography';
        else if (n.includes('dimension')) fileKey = 'dimensions';
        else fileKey = n.replace(/[^a-z0-9]/g, '-');
      } else if (n.includes('t2') || n.includes('semantic')) {
        dir = 'semantic';
        if (n.includes('color')) fileKey = 'color' + modeSuffix;
        else if (n.includes('typography') && n.includes('scale')) fileKey = 'typography-scale' + modeSuffix;
        else if (n.includes('typography') && n.includes('base')) fileKey = 'typography-base';
        else if (n.includes('dimension') && n.includes('space')) fileKey = 'dimensions-space' + modeSuffix;
        else if (n.includes('dimension') && n.includes('base')) fileKey = 'dimensions-base';
        else fileKey = n.replace(/[^a-z0-9]/g, '-') + modeSuffix;
      } else if (n.includes('t3') || n.includes('component')) {
        dir = 'component';
        fileKey = col.name.replace(/^T3\\s+Component\\s*\\/\\s*/i,'').replace(/[^a-zA-Z0-9-]/g,'-').toLowerCase() || 'tokens';
        if (col.variableIds.length === 0) continue;
      } else {
        dir = 'misc';
        fileKey = col.name.replace(/[^a-zA-Z0-9-]/g,'-').toLowerCase();
      }

      const data = extract(col.id, mode.modeId);
      if (Object.keys(data).length > 0) {
        result[dir + '/' + fileKey] = data;
      }
    }
  }

  return result;
})()
`;

// ─── Write token files ────────────────────────────────────────────────────────

function setNested(obj: Record<string, unknown>, parts: string[], value: unknown): void {
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Connecting to Figma Desktop Bridge…");
  const port = await findBridgePort();
  console.log(`  Connected on port ${port}`);

  console.log("Extracting variables from Figma plugin API…");
  const tokenData = (await executeInFigma(port, EXTRACTION_CODE)) as Record<string, unknown>;

  const tokensRoot = path.resolve(process.cwd(), "tokens");
  let filesWritten = 0;

  for (const [outputKey, data] of Object.entries(tokenData)) {
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) continue;

    const filePath = path.join(tokensRoot, `${outputKey}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    console.log(`  ✓ tokens/${outputKey}.json`);
    filesWritten++;
  }

  console.log(`\nSync complete. ${filesWritten} token files written.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
