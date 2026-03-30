/**
 * sync-icons.ts
 *
 * Two responsibilities:
 *
 * 1. Plugin sandbox code (exported constants) — runs inside Figma via figma_execute.
 *    Uses the same three-phase pattern as sync-tokens.ts:
 *
 *      ICONS_RESET_CODE      — clears any stale state before starting
 *      ICONS_EXTRACTION_CODE — fires the async extraction; stores result in globalThis.__syncIcons*
 *      ICONS_RETRIEVE_CODE   — returns the stored result (or null if not ready yet)
 *
 *    The /sync-icons command orchestrates these three calls, writes the result to a
 *    temp file, and pipes it into this script.
 *
 * 2. File writer — when invoked directly (via stdin pipe), reads the extracted icon
 *    data and writes React component TSX files into packages/react/src/components/icons/.
 *
 * Usage (via /sync-icons command — the normal path):
 *   1. Claude reads ICONS_RESET_CODE, ICONS_EXTRACTION_CODE, ICONS_RETRIEVE_CODE from this file.
 *   2. figma_execute(ICONS_RESET_CODE)       → clears state
 *   3. figma_execute(ICONS_EXTRACTION_CODE)  → starts async extraction (returns undefined)
 *   4. figma_execute(ICONS_RETRIEVE_CODE)    → returns icon data (or null if not ready)
 *   5. Write result JSON to /tmp/origin-icons-raw.json
 *   6. pnpm exec tsx scripts/sync-icons.ts < /tmp/origin-icons-raw.json
 *
 * Icon discovery rules:
 *   - Only COMPONENT nodes on the "Icons" page are extracted (not COMPONENT_SETs).
 *   - Components whose short name (after "icon/") starts with "_" are skipped
 *     (e.g. "icon/_placeholder" is a Figma-internal placeholder).
 *   - Each component is exported as SVG via exportAsync.
 *
 * SVG → TSX transformation:
 *   - width/height attributes removed (sizing is done by the parent via 1em × 1em wrapper).
 *   - fill="currentColor" set on the <svg> root so colour inherits from the button/context.
 *   - Explicit fill="<colour>" attributes are stripped from child elements so they inherit.
 *   - fill="none" on children is preserved (intentional cutouts / stroke-based paths).
 *   - Hyphenated SVG attributes converted to JSX camelCase (fillRule, clipRule, etc.).
 *   - xmlns removed (not needed in JSX).
 *   - Each component is a forwardRef wrapping the SVG with {...props} spread so callers
 *     can pass className, style, aria-label, etc.
 */

import fs from "node:fs";
import path from "node:path";

// ─── Phase 0: Reset state ─────────────────────────────────────────────────────

export const ICONS_RESET_CODE = `
globalThis.__syncIconsDone = false;
globalThis.__syncIconsResult = undefined;
globalThis.__syncIconsError = undefined;
`;

// ─── Phase 1: Extraction (runs inside Figma plugin sandbox) ───────────────────

export const ICONS_EXTRACTION_CODE = `
(async () => {
  try {
    await figma.loadAllPagesAsync();
    const iconsPage = figma.root.children.find(p => p.name === 'Icons');
    if (!iconsPage) throw new Error('Icons page not found');

    const components = iconsPage.findAll(n =>
      n.type === 'COMPONENT' &&
      n.name.startsWith('icon/') &&
      !n.name.slice('icon/'.length).startsWith('_')
    );

    const results = [];
    for (const component of components) {
      const bytes = await component.exportAsync({ format: 'SVG', svgSimplifyStroke: true });
      // Decode Uint8Array to string without spread (safe for large SVGs)
      let svg = '';
      for (let i = 0; i < bytes.length; i++) svg += String.fromCharCode(bytes[i]);
      results.push({ name: component.name, svg });
    }

    globalThis.__syncIconsResult = results;
    globalThis.__syncIconsDone = true;
  } catch (e) {
    globalThis.__syncIconsError = String(e);
    globalThis.__syncIconsDone = true;
  }
})();
`;

// ─── Phase 2: Retrieve result ─────────────────────────────────────────────────

export const ICONS_RETRIEVE_CODE = `
if (!globalThis.__syncIconsDone) return null;
if (globalThis.__syncIconsError) throw new Error('Icon extraction failed: ' + globalThis.__syncIconsError);
return globalThis.__syncIconsResult;
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 'icon/arrow-right' → 'ArrowRightIcon' */
function toComponentName(figmaName: string): string {
  const short = figmaName.replace(/^icon\//, "");
  const pascal = short
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
  return pascal + "Icon";
}

/** 'icon/arrow-right' → 'arrow-right' (used as the file stem) */
function toFileStem(figmaName: string): string {
  return figmaName.replace(/^icon\//, "");
}

/**
 * Transform a raw Figma SVG export into a React-safe JSX string suitable for
 * embedding in a forwardRef component body.
 */
function transformSvgInner(svg: string): { viewBox: string; inner: string } {
  // Extract viewBox (fall back to Figma default)
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 20 20";

  // Extract everything between the opening and closing <svg> tags
  const innerMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  let inner = innerMatch ? innerMatch[1].trim() : "";

  // Strip hardcoded fill colours from child elements so they inherit currentColor.
  // Preserve fill="none" (intentional cutouts / stroke-only paths).
  inner = inner.replace(/\sfill="(?!none")[^"]*"/g, "");

  // Convert hyphenated SVG attributes to JSX camelCase
  inner = inner
    .replace(/\sfill-rule=/g, " fillRule=")
    .replace(/\sclip-rule=/g, " clipRule=")
    .replace(/\sstroke-width=/g, " strokeWidth=")
    .replace(/\sstroke-linecap=/g, " strokeLinecap=")
    .replace(/\sstroke-linejoin=/g, " strokeLinejoin=")
    .replace(/\sstroke-miterlimit=/g, " strokeMiterlimit=")
    .replace(/\sstroke-dasharray=/g, " strokeDasharray=")
    .replace(/\sstroke-dashoffset=/g, " strokeDashoffset=");

  return { viewBox, inner };
}

function generateComponentFile(componentName: string, viewBox: string, inner: string): string {
  return `import { forwardRef } from "react";

export const ${componentName} = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  (props, ref) => (
    <svg
      ref={ref}
      viewBox="${viewBox}"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      ${inner}
    </svg>
  )
);
${componentName}.displayName = "${componentName}";
`;
}

// ─── File writer ──────────────────────────────────────────────────────────────

interface IconData {
  name: string;
  svg: string;
}

function writeIconFiles(icons: IconData[]): void {
  const outDir = path.resolve(
    process.cwd(),
    "packages/react/src/components/icons"
  );
  fs.mkdirSync(outDir, { recursive: true });

  const exports: string[] = [];

  for (const { name, svg } of icons) {
    const componentName = toComponentName(name);
    const fileStem = toFileStem(name);
    const { viewBox, inner } = transformSvgInner(svg);

    const content = generateComponentFile(componentName, viewBox, inner);
    const filePath = path.join(outDir, `${componentName}.tsx`);
    fs.writeFileSync(filePath, content);
    console.log(`  ✓ ${componentName}.tsx  (${fileStem})`);

    exports.push(`export { ${componentName} } from "./${componentName}.js";`);
  }

  // Write barrel index
  const indexPath = path.join(outDir, "index.ts");
  fs.writeFileSync(indexPath, exports.join("\n") + "\n");
  console.log(`  ✓ index.ts  (${exports.length} icons)`);

  console.log(`\nIcon sync complete. ${icons.length} icon(s) written to packages/react/src/components/icons/`);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

const raw = fs.readFileSync("/dev/stdin", "utf8").trim();
if (!raw) {
  console.error("Error: no input on stdin.");
  console.error("Usage: pnpm exec tsx scripts/sync-icons.ts < /tmp/origin-icons-raw.json");
  process.exit(1);
}

writeIconFiles(JSON.parse(raw) as IconData[]);
