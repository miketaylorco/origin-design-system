/**
 * drift-check.ts
 *
 * Compares the current Figma variable values against the committed tokens/ JSON
 * and reports any discrepancies (drift).
 *
 * Usage:
 *   FIGMA_ACCESS_TOKEN=xxx pnpm drift-check
 *
 * Exit code:
 *   0 — no drift detected
 *   1 — drift found (fails CI)
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

const FILE_KEY =
  process.env["FIGMA_FILE_KEY"] ?? "bmFwMCXLLT9SKrsm1aDijr";
const ACCESS_TOKEN = process.env["FIGMA_ACCESS_TOKEN"];

if (!ACCESS_TOKEN) {
  console.error("Error: FIGMA_ACCESS_TOKEN environment variable is required.");
  process.exit(1);
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface FigmaVariableValue {
  r?: number;
  g?: number;
  b?: number;
  a?: number;
}

interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

type FigmaResolvedValue =
  | FigmaVariableValue
  | FigmaVariableAlias
  | number
  | string
  | boolean;

interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  valuesByMode: Record<string, FigmaResolvedValue>;
  remote: boolean;
  hiddenFromPublishing: boolean;
}

interface FigmaVariableCollection {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  defaultModeId: string;
  variableIds: string[];
  remote: boolean;
}

interface FigmaVariablesResponse {
  meta: {
    variables: Record<string, FigmaVariable>;
    variableCollections: Record<string, FigmaVariableCollection>;
  };
}

interface DriftItem {
  token: string;
  figma: string;
  code: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbaToHex(color: FigmaVariableValue): string {
  const r = Math.round((color.r ?? 0) * 255);
  const g = Math.round((color.g ?? 0) * 255);
  const b = Math.round((color.b ?? 0) * 255);
  const a = color.a ?? 1;
  if (a < 1) {
    const alpha = Math.round(a * 255).toString(16).padStart(2, "0");
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${alpha}`;
  }
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function figmaValueToString(
  variable: FigmaVariable,
  value: FigmaResolvedValue,
  allVars: Record<string, FigmaVariable>
): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as FigmaVariableAlias).type === "VARIABLE_ALIAS"
  ) {
    const ref = allVars[(value as FigmaVariableAlias).id];
    return ref ? `{${ref.name.replace(/\//g, ".")}}` : "[alias]";
  }
  if (variable.resolvedType === "COLOR") {
    return rgbaToHex(value as FigmaVariableValue);
  }
  return String(value);
}

/** Read all JSON files in tokens/ and flatten to a name → value map */
function loadCodeTokens(): Map<string, string> {
  const tokensRoot = path.resolve(process.cwd(), "tokens");
  const map = new Map<string, string>();

  function walk(dir: string, prefix: string = "") {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full, prefix);
      } else if (entry.name.endsWith(".json")) {
        const raw = JSON.parse(fs.readFileSync(full, "utf8")) as Record<string, unknown>;
        flattenTokens(raw, [], map);
      }
    }
  }

  function flattenTokens(
    obj: Record<string, unknown>,
    pathParts: string[],
    out: Map<string, string>
  ): void {
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith("$")) continue;
      const newPath = [...pathParts, key];
      if (typeof val === "object" && val !== null && "$value" in val) {
        const tokenKey = newPath.join("/");
        out.set(tokenKey, String((val as Record<string, unknown>)["$value"]));
      } else if (typeof val === "object" && val !== null) {
        flattenTokens(val as Record<string, unknown>, newPath, out);
      }
    }
  }

  if (fs.existsSync(tokensRoot)) walk(tokensRoot);
  return map;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Fetching current Figma variables for drift check…\n");

  const res = await fetch(
    `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`,
    { headers: { "X-Figma-Token": ACCESS_TOKEN! } }
  );

  if (!res.ok) {
    console.error(`Figma API error ${res.status}: ${await res.text()}`);
    process.exit(1);
  }

  const data = (await res.json()) as FigmaVariablesResponse;
  const { variables, variableCollections } = data.meta;

  const codeTokens = loadCodeTokens();

  if (codeTokens.size === 0) {
    console.warn(
      "⚠️  No token files found in tokens/. Run pnpm sync-tokens first."
    );
    process.exit(0);
  }

  const drift: DriftItem[] = [];
  const newInFigma: string[] = [];

  for (const collection of Object.values(variableCollections)) {
    if (collection.remote) continue;

    for (const varId of collection.variableIds) {
      const variable = variables[varId];
      if (!variable || variable.remote || variable.hiddenFromPublishing) continue;

      const modeValue = variable.valuesByMode[collection.defaultModeId];
      if (modeValue === undefined) continue;

      const figmaValue = figmaValueToString(variable, modeValue, variables);
      const tokenKey = variable.name.toLowerCase().replace(/\s+/g, "-");

      if (codeTokens.has(tokenKey)) {
        const codeValue = codeTokens.get(tokenKey)!;
        // Normalize for comparison: lowercase, strip spaces
        const normalizedFigma = figmaValue.toLowerCase().replace(/\s/g, "");
        const normalizedCode = codeValue.toLowerCase().replace(/\s/g, "");
        if (normalizedFigma !== normalizedCode) {
          drift.push({ token: tokenKey, figma: figmaValue, code: codeValue });
        }
      } else {
        newInFigma.push(tokenKey);
      }
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────────

  if (newInFigma.length > 0) {
    console.log(`ℹ️  ${newInFigma.length} new token(s) in Figma not yet synced to code:`);
    for (const t of newInFigma.slice(0, 20)) {
      console.log(`   + ${t}`);
    }
    if (newInFigma.length > 20) {
      console.log(`   … and ${newInFigma.length - 20} more`);
    }
    console.log("");
  }

  if (drift.length === 0) {
    console.log("✅ No drift detected — tokens are in sync with Figma.");
    process.exit(0);
  }

  console.error(`❌ ${drift.length} token(s) have drifted from Figma:\n`);
  for (const { token, figma, code } of drift) {
    console.error(`  ${token}`);
    console.error(`    Figma: ${figma}`);
    console.error(`    Code:  ${code}`);
  }

  console.error(
    "\nRun `pnpm sync-tokens` to pull the latest values from Figma."
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
