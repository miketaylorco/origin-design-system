# Origin Design System — Claude Instructions

## Component authoring rules

### Token usage

| Tier | Where | What goes here |
|---|---|---|
| **T2 Semantic** | `tokens/semantic/color.{light,dark}.json` | Cross-component colours: surfaces, text, borders, utility states, shared interaction scales |
| **T3 Geometry** | `tokens/component/<name>.json` | Component-specific geometry: padding, radius, font-size, line-height, focus ring. Mode-invariant. |
| **T3 Colour** | `tokens/component/<name>-color.{light,dark}.json` | Component-specific colours only used by one component. |

**Rule:** A colour belongs in T2 only if another component could legitimately share its semantic meaning. If it's only ever consumed by one component, it's T3 — put it in `<name>-color.light.json`.

In components, reference tokens via:
- T2 colours → Tailwind utility classes: `bg-background-raised`, `text-utility-error-text`
- T3 colours → Tailwind utility classes generated from `*.light.json`: `bg-badge-neutral-background-default`
- T3 geometry → Tailwind arbitrary-value syntax: `px-[var(--badge-spacing-padding-x)]`

**Never** use raw hex/rgb values, Tailwind's built-in colour palette (e.g. `bg-gray-100`), or T1 primitive tokens directly in components.

### File structure for each new component
```
tokens/component/<name>.json                  ← T3 geometry (padding, radius, font-size, focus ring)
tokens/component/<name>-color.light.json      ← T3 component colours, light values
tokens/component/<name>-color.dark.json       ← T3 component colour overrides for dark mode
                                                 (only tokens whose values differ — aliased tokens
                                                 resolve automatically via the T2 dark override)
packages/react/src/components/<Name>/
  <Name>.tsx                                  ← component (forwardRef + cva + cn)
  <Name>.stories.tsx                          ← Storybook stories
  <Name>.test.tsx                             ← vitest + RTL + jest-axe
  index.ts                                    ← barrel export
packages/react/src/index.ts                   ← add named export here
```
### Preferred authoring order

Always work **Figma-first** so Figma remains the single source of truth for token values:

1. **Create Figma variables** — T2 semantic colours and T3 component geometry in Figma (via Figma Console MCP)
2. **Create the Figma component set** — bind all nodes to the variables created in step 1; capture a screenshot and present it to the user
3. **Wait for confirmation** — do not proceed to any code steps until the user has reviewed the Figma variables and component set and explicitly confirmed they are correct
4. **`sync-tokens`** — pull variables into `tokens/semantic/` and `tokens/component/` JSON files
5. **`pnpm build-tokens`** — regenerate CSS/Tailwind outputs from the synced JSON
6. **Write the component** — use only the token classes and CSS vars that now exist in the generated outputs
7. **`sync-tokens` again** — final check that no drift was introduced during component authoring

Avoid the reverse (code → Figma) pattern: it creates token values that live only in the JSON files and will be silently overwritten or lost on the next sync.

### Required build steps

Run these in order whenever tokens or components change. Skipping any step will cause missing styles or missing exports.

| Trigger | Command | Why |
|---|---|---|
| Any change to `tokens/**/*.json` | `pnpm build-tokens` (repo root) | Regenerates CSS custom properties, Tailwind preset, and JS token exports |
| Any change to `packages/react/src/**` | `pnpm build` in `packages/react/` | Compiles source to `dist/` — required by Sandbox and any external consumer of `@origin/react` |
| After `pnpm build-tokens` while Storybook is running | Restart the Storybook dev server | Storybook imports the token CSS and Tailwind preset at startup; a running server won't pick up regenerated files via HMR |

**Checklist for a new component:**
1. `pnpm build-tokens` — after writing `tokens/component/<name>.json` (and any new semantic colour tokens)
2. `pnpm build` in `packages/react/` — after writing the component source and adding it to `src/index.ts`
3. Restart Storybook — to see styled stories
4. Sandbox picks up the rebuilt dist automatically on its next page load (no restart needed)
5. Run `/a11y-check` on the new component — fix any failures before considering the component done
6. Run `/figma-annotate` on the new component's Figma component set — keeps Figma spec in sync with the implementation

### Code patterns
- `forwardRef` on every component; spread `...props` onto the root element.
- `cva` + `cn` for all variant-driven class composition.
- `useId()` (React 18) for auto-generating accessible IDs.
- Component token CSS vars are referenced as `[property:var(--component-token)]` in Tailwind arbitrary-value syntax.

### Support text slots (helper text + error message)
When a component accepts both a persistent hint (`helperText`) and a validation message (`errorMessage`), render them as **independent elements** — never suppress one in favour of the other.
- Each slot gets its own stable id: `${id}-helper`, `${id}-error`.
- `aria-describedby` space-joins whichever ids are currently rendered: `"id-helper id-error"`.
- No boolean show/hide props — callers control visibility by passing or omitting the string.
- Screen readers will announce both: helper text first (persistent context), error message second (immediate feedback).

```tsx
const describedBy =
  [helperText && helperId, errorMessage && errorId]
    .filter(Boolean).join(' ') || undefined;
```

### Stories (Storybook 10 / react-vite)
- Import `Meta`/`StoryObj` from `"@storybook/react-vite"`.
- Import test utilities from `"storybook/test"` (not `"@storybook/test"`).
- Every component must have `tags: ["autodocs"]` in meta.
- Include `play` functions for interactive states (typing, focus, error trigger).
- Use `canvas.getByRole(...)` directly — do **not** wrap `canvas` in `within()`.
- Keep stories current: whenever a prop, token reference, or behaviour changes, update the relevant `description` strings, argType entries, and `play` functions in the same PR/change. Stale story copy (e.g. wrong token tier names, outdated prop descriptions) is a documentation bug.

### Tests (vitest + RTL + jest-axe)
- Every component must have at least one `axe` accessibility test per meaningful state (default, error, disabled).
- Prefer role/label queries over class assertions.
- Use `userEvent` for all simulated interactions.

---

## Figma alignment (mandatory for every code change)

Code and Figma are the two sources of truth — they must stay in sync. Apply these steps whenever a component or token is **created or updated** on the code side.

### When adding a new component

1. **T3 Figma variables** — Create a new collection `T3 Component / <Name>` in Figma (via Figma Console MCP). Each variable must alias the appropriate T2 semantic variable (never hardcode values). Use correct scopes: `GAP` for spacing, `CORNER_RADIUS` for radius, `FONT_SIZE`, `LINE_HEIGHT`.
2. **Figma component page** — Create a new page named `<ComponentName>` inserted after the previous component page (before the `---` divider). Add a Section containing a component set named `<Component Name>`.
3. **Variants** — The component set must have a `State` property covering every meaningful visual state that maps to a React prop: `Default`, `Focused`, `Error`, `Disabled`, `Read-only`. Add a `Has helper text` variant property (values: `false` / `true`) for any component that accepts optional support text. Components with both helper and error text slots must expose both layers in every variant, with `visible` set per-variant — never merge them into a single slot.
4. **Focus ring in Figma** — Figma has no CSS `outline`, so focus rings are built as a separate `focus-ring` RECTANGLE child, **absolutely positioned** inside the interactive element frame:
   - `layoutPositioning: 'ABSOLUTE'`, `clipsContent: false` on the parent.
   - Offset: `-(ring-offset + strokeWeight / 2)` on every side = **-3 px** (with 2 px ring-offset and 2 px stroke).
   - Size: element width/height + 2 × 3 px on each axis.
   - `strokeAlign: 'CENTER'`, stroke bound to `border/focus` (T2), weight and radius bound to T3 component focus tokens.
   - The element's own border stays at its **default colour** in the focused state — do not change it to the focus colour.
5. **Icons in Figma** — When a component uses icons, always use existing Figma icon components (search the Icons page via `figma_search_components`). If a relevant icon exists, instantiate it. If no suitable icon exists, use the `icon/placeholder` component — never draw new vectors from scratch or reconstruct SVG paths from the React icon source files.
6. **Variable bindings** — All geometry (padding, radius, font-size, line-height, item spacing) must be bound to T3 component variables. All colours must be bound to T2 semantic colour variables. Never use raw hex values.
7. **Screenshot check** — After creating the component set, capture a screenshot with `figma_capture_screenshot` and confirm all variants render correctly before finishing.

### When changing token structure

Any time a token is **renamed, restructured, moved between tiers, or deleted** — whether the change originates in Figma or in code — verify both sides are aligned and a sync would be safe. Run through this checklist before finishing the change:

1. **Figma ↔ code naming matches** — The variable name in Figma (slash-separated) must produce the same dot-separated path that the JSON files use. A Figma variable `utility/success/background/hover` syncs to `utility.success.background.hover` in JSON and `--utility-success-background-hover` in CSS. If you rename in one place, rename in the other.

2. **Alias chains are intact** — If a T3 variable aliases a T2 variable, and the T2 variable was renamed, confirm the T3 variable's alias still resolves (in Figma, aliases are stored by ID so renames are safe; in JSON, aliases use dotted paths so they must be updated manually).

3. **CSS var references updated** — Grep for the old CSS variable name (`--old-name`) across all source files (`.tsx`, `.ts`, `.mdx`, `.css`). Any hardcoded `var(--old-name)` references must be updated. Tailwind utility class names derived from the old path (e.g. `bg-old-name`) must also be updated in component files.

4. **Sync output would match current JSON** — Mentally trace the changed variable through `sync-tokens` logic: is it T1 hidden (resolves to hex), T2/T3 non-hidden (kept as alias ref `{dotted.path}`)? Confirm the resulting value matches what is now in the JSON file. If unsure, run a dry sync and compare.

5. **`pnpm build-tokens` passes cleanly** — Run it after every token structure change. A clean build confirms the CSS/Tailwind outputs are consistent with the new structure.

**Scope of "structure change":** renaming a variable, restructuring a leaf into a group (e.g. `background` → `background/default`), moving a variable between collections/tiers, deleting a variable, or adding a new variable that introduces a new group level.

### When updating an existing component

- If a **React prop or visual state is added/removed**: update the Figma component set variants to match, and update `<Name>.stories.tsx` — add/remove stories, update argType descriptions, and adjust any `play` functions that exercise the changed behaviour.
- If a **token tier or token name changes**: update all string references to that token in the story file (descriptions, comments) so they stay accurate.
- If a **T3 token is added/changed**: update the corresponding Figma variable in the `T3 Component / <Name>` collection and re-bind affected nodes.
- If a **T2 semantic token is added**: add it to both `tokens/semantic/color.light.json` AND `tokens/semantic/color.dark.json`, then follow the build checklist above (`pnpm build-tokens` → rebuild react package → restart Storybook).

### Figma file reference
- File: **Origin Design System** · key `bmFwMCXLLT9SKrsm1aDijr`
- Connected via Figma Console MCP (WebSocket bridge, port 9224)
- T2 colour variables use Figma names like `background/raised`, `border/subdued`, `utility/error/border` (slashes, no prefix)
- T3 component variables use names like `text-field/spacing/padding-x`, `button/radius/sm`

---

### Semantic token reference (T2 — available now)
| Purpose              | Token class                              |
|----------------------|------------------------------------------|
| Page background      | `bg-background-default`                  |
| Raised surface       | `bg-background-raised`                   |
| Subdued surface      | `bg-background-subdued`                  |
| Body text            | `text-text-default`                      |
| Subdued text         | `text-text-subdued`                      |
| Subtle / placeholder | `text-text-subtle`                       |
| Border default       | `border-border-default`                  |
| Border subdued       | `border-border-subdued`                  |
| Border subtle        | `border-border-subtle`                   |
| Border strong        | `border-border-strong`                   |
| Focus ring colour    | `outline-border-focus` / `border-focus`  |
| Error background     | `bg-utility-error-background-default`    |
| Error bg hover       | `bg-utility-error-background-hover`      |
| Error bg active      | `bg-utility-error-background-active`     |
| Error text           | `text-utility-error-text`                |
| Error border         | `border-utility-error-border`            |
| Warning background   | `bg-utility-warning-background-default`  |
| Warning bg hover     | `bg-utility-warning-background-hover`    |
| Warning bg active    | `bg-utility-warning-background-active`   |
| Warning text         | `text-utility-warning-text`              |
| Warning border       | `border-utility-warning-border`          |
| Success background   | `bg-utility-success-background-default`  |
| Success bg hover     | `bg-utility-success-background-hover`    |
| Success bg active    | `bg-utility-success-background-active`   |
| Success text         | `text-utility-success-text`              |
| Success border       | `border-utility-success-border`          |
| Info background      | `bg-utility-info-background-default`     |
| Info bg hover        | `bg-utility-info-background-hover`       |
| Info bg active       | `bg-utility-info-background-active`      |
| Info text            | `text-utility-info-text`                 |
| Info border          | `border-utility-info-border`             |
