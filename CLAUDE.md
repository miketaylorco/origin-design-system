# Origin Design System — Claude Instructions

## Component authoring rules

### Token usage
- **T3 component tokens** (CSS custom properties via `var(--component-...)`) for geometry: padding, border-radius, font-size, line-height, focus-ring geometry.
- **T2 semantic tokens** via Tailwind utility classes for all colours: `bg-background-raised`, `text-text-default`, `border-border-subdued`, `text-utility-error-text`, etc.
- **Never** use raw hex/rgb values, Tailwind's built-in colour palette (e.g. `bg-gray-100`), or T1 primitive tokens directly in components.
- When a needed semantic colour doesn't exist, say so and propose adding it to `tokens/semantic/color.light.json` rather than reaching for a primitive.

### File structure for each new component
```
tokens/component/<component-name>.json        ← T3 tokens (add here first)
packages/react/src/components/<Name>/
  <Name>.tsx                                  ← component (forwardRef + cva + cn)
  <Name>.stories.tsx                          ← Storybook stories
  <Name>.test.tsx                             ← vitest + RTL + jest-axe
  index.ts                                    ← barrel export
packages/react/src/index.ts                   ← add named export here
```
After adding a `tokens/component/*.json`, run `pnpm build-tokens` to regenerate CSS/JS/Tailwind outputs.

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
5. **Variable bindings** — All geometry (padding, radius, font-size, line-height, item spacing) must be bound to T3 component variables. All colours must be bound to T2 semantic colour variables. Never use raw hex values.
6. **Screenshot check** — After creating the component set, capture a screenshot with `figma_capture_screenshot` and confirm all variants render correctly before finishing.

### When updating an existing component

- If a **React prop or visual state is added/removed**: update the Figma component set variants to match.
- If a **T3 token is added/changed**: update the corresponding Figma variable in the `T3 Component / <Name>` collection and re-bind affected nodes.
- If a **T2 semantic token is added**: add it to both `tokens/semantic/color.light.json` AND `tokens/semantic/color.dark.json`, then run `pnpm build-tokens`.

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
| Error background     | `bg-utility-error-background`            |
| Error text           | `text-utility-error-text`                |
| Error border         | `border-utility-error-border`            |
| Warning background   | `bg-utility-warning-background`          |
| Warning text         | `text-utility-warning-text`              |
| Warning border       | `border-utility-warning-border`          |
| Success text         | `text-utility-success-text`              |
| Success border       | `border-utility-success-border`          |
| Info text            | `text-utility-info-text`                 |
| Info border          | `border-utility-info-border`             |
