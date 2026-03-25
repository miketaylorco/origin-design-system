/**
 * build-tokens.ts
 *
 * Builds token outputs in packages/tokens/ from the JSON source in tokens/.
 *
 * Uses two separate Style Dictionary instances to avoid token path collisions
 * between modes (light/dark, desktop/tablet/mobile):
 *
 *   Instance 1 — Primitives
 *     source:  tokens/primitive/**
 *     outputs: css/primitive.css, js/tokens.js, tailwind/preset.js
 *
 *   Instance 2 — Semantic base (light + desktop)
 *     include: tokens/primitive/** (available for ref resolution, not emitted)
 *     source:  tokens/semantic/color.light + typography/dimensions base + desktop
 *     outputs: css/semantic-base.css
 *
 * Dark mode and responsive overrides are generated directly from JSON
 * (bypassing SD) to avoid collision errors from identical token paths
 * across modes.
 */

import StyleDictionary from "style-dictionary";
import fs from "node:fs";
import path from "node:path";

const tokensDir = path.resolve("tokens");
const cssOut = path.resolve("packages/tokens/css");
const jsOut = path.resolve("packages/tokens/js");
const twOut = path.resolve("packages/tokens/tailwind");

fs.mkdirSync(cssOut, { recursive: true });
fs.mkdirSync(jsOut, { recursive: true });
fs.mkdirSync(twOut, { recursive: true });

// ─── Manual CSS generator (for dark / responsive overrides) ───────────────────

/** Convert {a.b.c} alias ref to var(--a-b-c) */
function refToVar(value: string): string {
  return value.replace(/\{([^}]+)\}/g, (_, p: string) =>
    `var(--${p.replace(/\./g, "-")})`
  );
}

/** Recursively flatten a token JSON object to CSS custom property declarations */
function toCssDeclarations(
  obj: Record<string, unknown>,
  prefix = ""
): string[] {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith("$")) continue;
    const name = prefix ? `${prefix}-${key}` : key;
    if (val && typeof val === "object" && "$value" in (val as object)) {
      const raw = String((val as Record<string, unknown>)["$value"]);
      lines.push(`  --${name}: ${raw.startsWith("{") ? refToVar(raw) : raw};`);
    } else if (typeof val === "object" && val !== null) {
      lines.push(...toCssDeclarations(val as Record<string, unknown>, name));
    }
  }
  return lines;
}

/** Read one or more token JSON files and emit a CSS block */
function buildCssBlock(
  files: string[],
  selector: string,
  mediaQuery?: string
): string {
  const declarations: string[] = [];
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const data = JSON.parse(
      fs.readFileSync(file, "utf8")
    ) as Record<string, unknown>;
    declarations.push(...toCssDeclarations(data));
  }
  if (declarations.length === 0) return "";

  const inner = `${selector} {\n${declarations.join("\n")}\n}`;
  if (!mediaQuery) return inner;
  return `${mediaQuery} {\n${inner
    .split("\n")
    .map((l) => `  ${l}`)
    .join("\n")}\n}`;
}

// ─── Tailwind preset generator ────────────────────────────────────────────────

type NestedTheme = { [k: string]: string | NestedTheme };

function setNested(obj: NestedTheme, parts: string[], value: string): void {
  let cur: NestedTheme = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i]!;
    if (typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k] as NestedTheme;
  }
  cur[parts[parts.length - 1]!] = value;
}

function buildTailwindPreset(): string {
  const colors: NestedTheme = {};
  const spacing: NestedTheme = {};
  const fontSize: NestedTheme = {};
  const lineHeight: NestedTheme = {};
  const borderRadius: NestedTheme = {};
  const borderWidth: NestedTheme = {};
  const fontFamily: NestedTheme = {};
  const fontWeight: NestedTheme = {};
  const letterSpacing: NestedTheme = {};

  function walk(
    obj: Record<string, unknown>,
    pathParts: string[],
    tier: "primitive" | "semantic"
  ): void {
    for (const [key, val] of Object.entries(obj)) {
      if (key.startsWith("$")) continue;
      const p = [...pathParts, key];
      if (val && typeof val === "object" && "$value" in (val as object)) {
        const cssVar = `var(--${p.join("-")})`;

        if (tier === "semantic") {
          const type = String(
            (val as Record<string, unknown>)["$type"] ?? ""
          );
          if (type === "color") setNested(colors, p, cssVar);
          else if (p.some((x) => x === "inset" || x === "gap" || x === "stack"))
            setNested(spacing, p, cssVar);
          else if (p.some((x) => x === "font-size"))
            setNested(fontSize, p, cssVar);
          else if (p.some((x) => x === "line-height"))
            setNested(lineHeight, p, cssVar);
          else if (p.some((x) => x === "radius"))
            setNested(borderRadius, p, cssVar);
          else if (p.some((x) => x === "border-width"))
            setNested(borderWidth, p, cssVar);
          else if (p.some((x) => x === "font-family"))
            setNested(fontFamily, p, cssVar);
          else if (p.some((x) => x === "font-weight"))
            setNested(fontWeight, p, cssVar);
          else if (p.some((x) => x === "letter-spacing"))
            setNested(letterSpacing, p, cssVar);
        }

        if (tier === "primitive") {
          const type = String(
            (val as Record<string, unknown>)["$type"] ?? ""
          );
          if (type === "color")
            setNested(colors, ["primitive", ...p], cssVar);
          else if (type === "string" && p.some((x) => x === "font-family"))
            setNested(fontFamily, p, cssVar);
        }
      } else if (typeof val === "object" && val !== null) {
        walk(val as Record<string, unknown>, p, tier);
      }
    }
  }

  // Walk semantic base files (light + desktop, excluding per-mode duplicates)
  const semanticBaseFiles = [
    "semantic/color.light.json",
    "semantic/typography-scale.desktop.json",
    "semantic/dimensions-space.desktop.json",
    "semantic/typography-base.json",
    "semantic/dimensions-base.json",
  ];
  for (const f of semanticBaseFiles) {
    const full = path.join(tokensDir, f);
    if (fs.existsSync(full)) {
      walk(
        JSON.parse(fs.readFileSync(full, "utf8")) as Record<string, unknown>,
        [],
        "semantic"
      );
    }
  }

  // Walk primitive typography for font-family (STRING tokens not in semantic files)
  const primTypography = path.join(tokensDir, "primitive/typography.json");
  if (fs.existsSync(primTypography)) {
    walk(
      JSON.parse(fs.readFileSync(primTypography, "utf8")) as Record<string, unknown>,
      [],
      "primitive"
    );
  }

  // Walk primitive color for the primitive.* namespace
  const primColor = path.join(tokensDir, "primitive/color.json");
  if (fs.existsSync(primColor)) {
    walk(
      JSON.parse(fs.readFileSync(primColor, "utf8")) as Record<string, unknown>,
      [],
      "primitive"
    );
  }

  const preset = {
    theme: {
      extend: {
        colors,
        spacing,
        fontSize,
        lineHeight,
        borderRadius,
        borderWidth,
        fontFamily,
        fontWeight,
        letterSpacing,
      },
    },
    darkMode: ["class"] as const,
  };

  return (
    `// Auto-generated. Do not edit — run: pnpm build-tokens\n\n` +
    `export default ${JSON.stringify(preset, null, 2)};\n`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── 1. Primitives (Style Dictionary) ────────────────────────────────────────
  console.log("Building primitives…");
  const sdPrimitives = new StyleDictionary({
    source: ["tokens/primitive/**/*.json"],
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: "packages/tokens/css/",
        files: [
          {
            destination: "primitive.css",
            format: "css/variables",
            options: { selector: ":root", outputReferences: false },
          },
        ],
      },
      js: {
        transformGroup: "js",
        buildPath: "packages/tokens/js/",
        files: [
          { destination: "tokens.js", format: "javascript/es6" },
          { destination: "tokens.d.ts", format: "typescript/es6-declarations" },
        ],
      },
    },
  });
  await sdPrimitives.buildAllPlatforms();

  // ── 2. Semantic base — light + desktop (Style Dictionary) ────────────────────
  // include = primitives (available for ref resolution but not emitted)
  // source  = semantic base files (emitted)
  console.log("Building semantic base (light/desktop)…");
  const sdBase = new StyleDictionary({
    include: ["tokens/primitive/**/*.json"],
    source: [
      "tokens/semantic/color.light.json",
      "tokens/semantic/typography-scale.desktop.json",
      "tokens/semantic/dimensions-space.desktop.json",
      "tokens/semantic/typography-base.json",
      "tokens/semantic/dimensions-base.json",
    ],
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: "packages/tokens/css/",
        files: [
          {
            destination: "semantic-base.css",
            format: "css/variables",
            options: { selector: ":root", outputReferences: true },
          },
        ],
      },
    },
  });
  await sdBase.buildAllPlatforms();

  // ── 3. Dark mode override (manual CSS — avoids SD collision with light mode) ─
  console.log("Building dark mode override…");
  const darkCss = buildCssBlock(
    [path.join(tokensDir, "semantic/color.dark.json")],
    ".dark"
  );
  fs.writeFileSync(path.join(cssOut, "semantic-dark.css"), darkCss + "\n");
  console.log("  ✔ packages/tokens/css/semantic-dark.css");

  // ── 4. Responsive overrides (manual CSS) ────────────────────────────────────
  console.log("Building responsive overrides…");
  const tabletCss = buildCssBlock(
    [
      path.join(tokensDir, "semantic/typography-scale.tablet.json"),
      path.join(tokensDir, "semantic/dimensions-space.tablet.json"),
    ],
    ":root",
    "@media (max-width: 1024px)"
  );
  fs.writeFileSync(
    path.join(cssOut, "responsive-tablet.css"),
    tabletCss + "\n"
  );
  console.log("  ✔ packages/tokens/css/responsive-tablet.css");

  const mobileCss = buildCssBlock(
    [
      path.join(tokensDir, "semantic/typography-scale.mobile.json"),
      path.join(tokensDir, "semantic/dimensions-space.mobile.json"),
    ],
    ":root",
    "@media (max-width: 768px)"
  );
  fs.writeFileSync(
    path.join(cssOut, "responsive-mobile.css"),
    mobileCss + "\n"
  );
  console.log("  ✔ packages/tokens/css/responsive-mobile.css");

  // ── 5. Component tokens (manual CSS — one file per component) ───────────────
  const componentDir = path.join(tokensDir, "component");
  const componentFiles = fs.existsSync(componentDir)
    ? fs.readdirSync(componentDir).filter((f) => f.endsWith(".json")).map((f) => path.join(componentDir, f))
    : [];
  if (componentFiles.length > 0) {
    console.log("Building component tokens…");
    const componentCss = buildCssBlock(componentFiles, ":root");
    fs.writeFileSync(path.join(cssOut, "component.css"), componentCss + "\n");
    console.log("  ✔ packages/tokens/css/component.css");
  }

  // ── 6. Combined tokens.css ───────────────────────────────────────────────────
  const imports = [
    `@import "./primitive.css";`,
    `@import "./semantic-base.css";`,
    `@import "./semantic-dark.css";`,
    `@import "./responsive-tablet.css";`,
    `@import "./responsive-mobile.css";`,
  ];
  if (componentFiles.length > 0) imports.push(`@import "./component.css";`);
  fs.writeFileSync(path.join(cssOut, "tokens.css"), imports.join("\n") + "\n");
  console.log("  ✔ packages/tokens/css/tokens.css");

  // ── 7. Tailwind preset ───────────────────────────────────────────────────────
  console.log("Building Tailwind preset…");
  fs.writeFileSync(path.join(twOut, "preset.js"), buildTailwindPreset());
  fs.writeFileSync(
    path.join(twOut, "preset.d.ts"),
    `// Auto-generated. Do not edit — run: pnpm build-tokens\n` +
      `import type { Config } from "tailwindcss";\n` +
      `declare const preset: Partial<Config>;\n` +
      `export default preset;\n`
  );
  console.log("  ✔ packages/tokens/tailwind/preset.js");

  console.log("\nToken build complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
