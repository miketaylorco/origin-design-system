/**
 * sync-tokens.ts
 *
 * Two responsibilities:
 *
 * 1. Plugin sandbox code (exported constants) — runs inside Figma via figma_execute.
 *    figma_execute does not await Promise returns, so the extraction uses a three-phase
 *    approach with a Figma global to pass data between calls:
 *
 *      RESET_CODE      — clears any stale state before starting
 *      EXTRACTION_CODE — fires the async extraction; stores result in globalThis.__syncTokens
 *      RETRIEVE_CODE   — called after extraction completes; returns the stored result
 *                        (returns null if the async work hasn't finished yet)
 *
 *    The /sync-tokens skill orchestrates these three calls, then writes the result to a
 *    temp file and pipes it into this script.
 *
 * 2. File writer — when invoked directly (via stdin pipe), reads the extracted token
 *    data and writes it as W3C Design Token JSON files into tokens/.
 *
 * Usage (via /sync-tokens skill — the normal path):
 *   1. Claude reads RESET_CODE, EXTRACTION_CODE, RETRIEVE_CODE from this file.
 *   2. figma_execute(RESET_CODE)       → clears state
 *   3. figma_execute(EXTRACTION_CODE)  → starts async extraction (returns undefined)
 *   4. figma_execute(RETRIEVE_CODE)    → returns token object (or null if not ready)
 *   5. Write result JSON to /tmp/origin-tokens-raw.json
 *   6. pnpm exec tsx scripts/sync-tokens.ts < /tmp/origin-tokens-raw.json
 *
 * Prerequisites:
 *   - Figma desktop app open with the "Origin Design System" file
 *   - Figma Console MCP Desktop Bridge plugin running in that file
 *
 * Token visibility rules (enforced in EXTRACTION_CODE):
 *   - Variables with hiddenFromPublishing === true are excluded from output.
 *     Primitive palettes (colors, dimensions, letter-spacing, font-size, etc.)
 *     are marked hidden in Figma; they never appear as top-level token keys.
 *   - When a non-hidden token (semantic or component) aliases a hidden variable,
 *     the alias is resolved recursively to its raw value (hex, px, number)
 *     rather than emitting a {dotted.reference}.
 *   - Non-hidden primitives (font-family, font-weight) are kept as tokens and
 *     may be referenced by alias from semantic/component tokens as normal.
 */

import fs from "node:fs";
import path from "node:path";

// ─── Phase 0: Reset state ─────────────────────────────────────────────────────
// Call before EXTRACTION_CODE to clear any result from a previous run.

export const RESET_CODE = `
globalThis.__syncTokensDone = false;
globalThis.__syncTokensResult = undefined;
globalThis.__syncTokensError = undefined;
`;

// ─── Phase 1: Extraction (runs inside Figma plugin sandbox) ───────────────────
// Fires async work that stores its result in globalThis.__syncTokensResult.
// figma_execute returns immediately (undefined) — use RETRIEVE_CODE to get the result.

export const EXTRACTION_CODE = `
(async () => {
  try {
    const allVars = await figma.variables.getLocalVariablesAsync();
    const varMap = Object.fromEntries(allVars.map(v => [v.id, v]));

    function rgbaToHex(c) {
      const r=Math.round((c.r??0)*255),g=Math.round((c.g??0)*255),b=Math.round((c.b??0)*255),a=c.a??1;
      const h=v=>v.toString(16).padStart(2,'0');
      return a<1 ? \`#\${h(r)}\${h(g)}\${h(b)}\${Math.round(a*255).toString(16).padStart(2,'0')}\` : \`#\${h(r)}\${h(g)}\${h(b)}\`;
    }

    function rawToken(variable, value) {
      if (variable.resolvedType === 'COLOR') return { ${'$'}type: 'color', ${'$'}value: rgbaToHex(value) };
      if (variable.resolvedType === 'FLOAT') {
        const n = variable.name.toLowerCase();
        if (n.includes('letter-spacing')) return { ${'$'}type: 'number', ${'$'}value: value };
        if (
          n.includes('space') || n.includes('size') || n.includes('radius') ||
          n.includes('border-width') || n.includes('font-size') || n.includes('line-height')
        ) return { ${'$'}type: 'dimension', ${'$'}value: \`\${value}px\` };
        return { ${'$'}type: 'number', ${'$'}value: value };
      }
      if (variable.resolvedType === 'STRING') return { ${'$'}type: 'string', ${'$'}value: value };
      return { ${'$'}value: String(value) };
    }

    function toW3C(variable, value) {
      if (value?.type === 'VARIABLE_ALIAS') {
        const ref = varMap[value.id];
        if (ref) {
          if (ref.hiddenFromPublishing) {
            // Resolve hidden primitive to its raw value (use first/only mode).
            return toW3C(ref, Object.values(ref.valuesByMode)[0]);
          }
          // Non-hidden target — keep as an alias reference, preserving the source type.
          const typeMap = { COLOR: 'color', FLOAT: 'number', STRING: 'string' };
          const aliasType = typeMap[variable.resolvedType] || variable.resolvedType.toLowerCase();
          return { ${'$'}type: aliasType, ${'$'}value: \`{\${ref.name.split('/').map(p => p.trim().toLowerCase().replace(/\\s+/g, '-')).join('.')}}\` };
        }
      }
      return rawToken(variable, value);
    }

    function setNested(obj, parts, value) {
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (typeof cur[k] !== 'object') cur[k] = {};
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
    }

    function extract(colId, modeId) {
      const result = {};
      for (const v of allVars) {
        if (v.remote || v.variableCollectionId !== colId) continue;
        if (v.hiddenFromPublishing) continue; // skip hidden primitives
        const val = v.valuesByMode[modeId];
        if (val === undefined) continue;
        const token = toW3C(v, val);
        if (v.description) token.${'$'}description = v.description;
        setNested(result, v.name.split('/').map(p => p.trim().toLowerCase().replace(/\\s+/g, '-')), token);
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
          if (n.includes('color'))           fileKey = 'color';
          else if (n.includes('typography')) fileKey = 'typography';
          else if (n.includes('dimension'))  fileKey = 'dimensions';
          else fileKey = n.replace(/[^a-z0-9]/g, '-');
        } else if (n.includes('t2') || n.includes('semantic')) {
          dir = 'semantic';
          if (n.includes('color'))                                   fileKey = 'color' + modeSuffix;
          else if (n.includes('typography') && n.includes('scale')) fileKey = 'typography-scale' + modeSuffix;
          else if (n.includes('typography') && n.includes('base'))  fileKey = 'typography-base';
          else if (n.includes('dimension') && n.includes('space'))  fileKey = 'dimensions-space' + modeSuffix;
          else if (n.includes('dimension') && n.includes('base'))   fileKey = 'dimensions-base';
          else fileKey = n.replace(/[^a-z0-9]/g, '-') + modeSuffix;
        } else if (n.includes('t3') || n.includes('component')) {
          dir = 'component';
          fileKey = (col.name.replace(/^T3\\s+Component\\s*\\/\\s*/i, '').replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase() || 'tokens') + modeSuffix;
          if (col.variableIds.length === 0) continue;
        } else {
          dir = 'misc';
          fileKey = col.name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
        }

        const data = extract(col.id, mode.modeId);
        if (Object.keys(data).length > 0) {
          result[dir + '/' + fileKey] = data;
        }
      }
    }

    globalThis.__syncTokensResult = result;
    globalThis.__syncTokensDone = true;
  } catch (e) {
    globalThis.__syncTokensError = String(e);
    globalThis.__syncTokensDone = true;
  }
})();
`;

// ─── Phase 2: Retrieve result ─────────────────────────────────────────────────
// Call after EXTRACTION_CODE. Returns the token object if extraction is complete,
// null if still running, or throws if the extraction errored.
// Safe to call multiple times — result stays available until the next RESET_CODE.

export const RETRIEVE_CODE = `
if (!globalThis.__syncTokensDone) return null;
if (globalThis.__syncTokensError) throw new Error('Token extraction failed: ' + globalThis.__syncTokensError);
return globalThis.__syncTokensResult;
`;

// ─── File writer ──────────────────────────────────────────────────────────────

function writeTokenFiles(tokenData: Record<string, unknown>): void {
  const tokensRoot = path.resolve(process.cwd(), "tokens");
  let filesWritten = 0;

  for (const [outputKey, data] of Object.entries(tokenData)) {
    if (!data || typeof data !== "object" || Object.keys(data as object).length === 0) continue;

    const filePath = path.join(tokensRoot, `${outputKey}.json`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    console.log(`  ✓ tokens/${outputKey}.json`);
    filesWritten++;
  }

  console.log(`\nSync complete. ${filesWritten} token files written.`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const raw = fs.readFileSync("/dev/stdin", "utf8").trim();
if (!raw) {
  console.error("Error: no input on stdin.");
  console.error("Usage: pnpm exec tsx scripts/sync-tokens.ts < /tmp/origin-tokens-raw.json");
  process.exit(1);
}

writeTokenFiles(JSON.parse(raw) as Record<string, unknown>);
