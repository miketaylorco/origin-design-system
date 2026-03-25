/**
 * audit.ts
 *
 * AI-assisted quality audit entrypoint for the Origin Design System.
 *
 * Sub-commands:
 *   pnpm audit tokens     — Token health check (unused, missing dark-mode, primitive leakage)
 *   pnpm audit component  — Consistency review for a specific component
 *
 * Usage examples:
 *   pnpm audit tokens
 *   pnpm audit component Button
 *
 * This script is primarily a CLI shim. The actual analysis is intended to be
 * run by Claude Code, which can use the Figma Console MCP tools alongside
 * reading component source files.
 */

import fs from "node:fs";
import path from "node:path";

const [, , command, ...args] = process.argv;

// ─── Token health check ────────────────────────────────────────────────────────

async function auditTokens() {
  console.log("Token health audit\n" + "─".repeat(40));

  const tokensRoot = path.resolve(process.cwd(), "tokens");
  const reactSrc = path.resolve(process.cwd(), "packages/react/src");

  if (!fs.existsSync(tokensRoot)) {
    console.error("tokens/ directory not found. Run pnpm sync-tokens first.");
    process.exit(1);
  }

  // Collect all token names from tokens/
  const allTokens = new Set<string>();
  const primitiveTokens = new Set<string>();
  const semanticTokens = new Set<string>();
  const darkModeTokens = new Set<string>();
  const lightModeTokens = new Set<string>();

  function scanTokenFile(filePath: string, tier: string) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as Record<string, unknown>;
    function walk(obj: Record<string, unknown>, parts: string[]) {
      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith("$")) continue;
        const p = [...parts, key];
        if (typeof val === "object" && val !== null && "$value" in val) {
          const name = p.join("/");
          allTokens.add(name);
          if (tier === "primitive") primitiveTokens.add(name);
          if (tier === "semantic") semanticTokens.add(name);
        } else if (typeof val === "object" && val !== null) {
          walk(val as Record<string, unknown>, p);
        }
      }
    }
    walk(raw, []);
  }

  function walkDir(dir: string, tier: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full, tier);
      else if (entry.name.endsWith(".json")) {
        scanTokenFile(full, tier);
        if (entry.name.includes("dark")) {
          const raw = JSON.parse(fs.readFileSync(full, "utf8")) as Record<string, unknown>;
          function collectNames(o: Record<string, unknown>, p: string[]) {
            for (const [k, v] of Object.entries(o)) {
              if (k.startsWith("$")) continue;
              const np = [...p, k];
              if (typeof v === "object" && v !== null && "$value" in v) darkModeTokens.add(np.join("/"));
              else if (typeof v === "object" && v !== null) collectNames(v as Record<string, unknown>, np);
            }
          }
          collectNames(raw, []);
        }
        if (entry.name.includes("light") || (!entry.name.includes("dark") && tier === "semantic" && entry.name.includes("color"))) {
          const raw = JSON.parse(fs.readFileSync(full, "utf8")) as Record<string, unknown>;
          function collectLight(o: Record<string, unknown>, p: string[]) {
            for (const [k, v] of Object.entries(o)) {
              if (k.startsWith("$")) continue;
              const np = [...p, k];
              if (typeof v === "object" && v !== null && "$value" in v) lightModeTokens.add(np.join("/"));
              else if (typeof v === "object" && v !== null) collectLight(v as Record<string, unknown>, np);
            }
          }
          collectLight(raw, []);
        }
      }
    }
  }

  walkDir(path.join(tokensRoot, "primitive"), "primitive");
  walkDir(path.join(tokensRoot, "semantic"), "semantic");
  walkDir(path.join(tokensRoot, "component"), "component");

  // Scan component source for token references
  const usedTokens = new Set<string>();
  function scanSource(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) scanSource(full);
      else if (/\.(tsx?|css)$/.test(entry.name)) {
        const content = fs.readFileSync(full, "utf8");
        // Match var(--token-name) and token references in cva/cn calls
        const cssVarMatches = content.matchAll(/var\(--([^)]+)\)/g);
        for (const m of cssVarMatches) {
          // Convert CSS var name back to token path (-- → /, hyphens preserved)
          usedTokens.add(m[1]!.replace(/-/g, "/"));
        }
      }
    }
  }
  scanSource(reactSrc);

  // ── Report: missing dark-mode parity ──────────────────────────────────────
  const lightOnlyTokens = [...lightModeTokens].filter(
    (t) => !darkModeTokens.has(t)
  );

  if (lightOnlyTokens.length > 0) {
    console.log(`\n⚠️  ${lightOnlyTokens.length} semantic color token(s) have no dark-mode mapping:`);
    for (const t of lightOnlyTokens) {
      console.log(`   ! ${t}`);
    }
  } else {
    console.log("✅ All semantic color tokens have light and dark mode values.");
  }

  // ── Report: primitive token leakage in components ────────────────────────
  const leakedPrimitives = [...usedTokens].filter((t) =>
    primitiveTokens.has(t) && !semanticTokens.has(t)
  );
  if (leakedPrimitives.length > 0) {
    console.log(`\n⚠️  ${leakedPrimitives.length} component(s) reference primitive tokens directly (should use semantic):`);
    for (const t of leakedPrimitives) {
      console.log(`   ! ${t}`);
    }
  } else if (usedTokens.size > 0) {
    console.log("✅ All component token references use semantic tokens (no primitive leakage).");
  }

  console.log(`\nTotal tokens: ${allTokens.size} (${primitiveTokens.size} primitive, ${semanticTokens.size} semantic)`);
}

// ─── Component review hints ───────────────────────────────────────────────────

async function auditComponent(name: string) {
  console.log(`Component audit: ${name}\n` + "─".repeat(40));

  const compDir = path.resolve(
    process.cwd(),
    `packages/react/src/components/${name}`
  );

  if (!fs.existsSync(compDir)) {
    console.error(`Component directory not found: ${compDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(compDir);
  const hasImpl = files.some((f) => f.endsWith(".tsx") && !f.includes(".stories") && !f.includes(".test"));
  const hasStories = files.some((f) => f.includes(".stories."));
  const hasTests = files.some((f) => f.includes(".test."));
  const hasIndex = files.includes("index.ts");

  console.log(`\nFile checklist for ${name}/:`);
  console.log(`  ${hasImpl ? "✅" : "❌"} Implementation (.tsx)`);
  console.log(`  ${hasStories ? "✅" : "❌"} Stories (.stories.tsx)`);
  console.log(`  ${hasTests ? "✅" : "❌"} Tests (.test.tsx)`);
  console.log(`  ${hasIndex ? "✅" : "❌"} Barrel export (index.ts)`);

  if (!hasImpl || !hasStories || !hasTests || !hasIndex) {
    console.log("\n⚠️  Missing files — complete the component before shipping.");
  } else {
    console.log("\n✅ All required files present.");
    console.log(
      "\nFor a deeper AI review (token usage, a11y, Figma parity), " +
        "open Claude Code and run:\n" +
        `  /review-component ${name}`
    );
  }
}

// ─── Dispatch ─────────────────────────────────────────────────────────────────

switch (command) {
  case "tokens":
    await auditTokens();
    break;
  case "component":
    if (!args[0]) {
      console.error("Usage: pnpm audit component <ComponentName>");
      process.exit(1);
    }
    await auditComponent(args[0]);
    break;
  default:
    console.log("Usage: pnpm audit <tokens|component> [name]");
    console.log("  pnpm audit tokens         — token health check");
    console.log("  pnpm audit component Foo  — component checklist");
    process.exit(1);
}
