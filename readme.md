# Origin Design System

Origin is a Figma-first, token-driven design system. Figma is the source of truth for all design decisions. Tokens (design variables) are extracted from Figma, compiled into CSS custom properties, JavaScript constants, and a Tailwind preset, and consumed by framework-specific component packages. The first framework target is React; the architecture is intentionally multi-framework (Vue, Web Components, etc. can be added later as new packages consuming the same tokens).

---

## Repo structure

This is a pnpm monorepo orchestrated by Turborepo.

| Path | Description |
|---|---|
| `tokens/` | Source token files in W3C Design Token JSON format, divided into three tiers (see Token architecture below) |
| `packages/tokens/` | Built token outputs (`@origin/tokens`) — CSS custom properties, ES module constants, Tailwind preset |
| `packages/react/` | React component library (`@origin/react`) — TypeScript, Tailwind CSS, CVA for variant management |
| `apps/storybook/` | Storybook v10 component catalog — interactive docs, a11y checks, Figma integration, MCP endpoint |
| `apps/sandbox/` | Lightweight Vite + React app for quick manual component testing outside of Storybook |
| `scripts/` | TypeScript utility scripts for the token pipeline and audits |
| `.github/workflows/` | GitHub Actions CI pipelines (currently triggered manually — see CI below) |

---

## Token architecture

Tokens follow a strict three-tier model:

- **T1 Primitive** — Raw values: brand colour palette, type scale, spacing and radius scales. Colour and dimension primitives are hidden in Figma to reduce noise; their values are resolved inline when semantic tokens are synced. Primitives are not used directly in components.
- **T2 Semantic** — Theme-aware, context-named tokens (e.g. `color.bg.primary`, `color.text.default`). Carry light/dark mode variants and desktop/tablet/mobile responsive variants. These are what components reference.
- **T3 Component** — Component-specific tokens (e.g. `button.focus-ring.color`). Defined per-component in Figma first, then synced.

> **Rule:** components always reference T2 or T3 tokens, never T1 primitives.

---

## Token pipeline (Figma to code)

1. **Sync** — `pnpm sync-tokens`
   Connects to the Figma Console MCP Desktop Bridge plugin (must be running in Figma desktop) and extracts all variables into `tokens/` as W3C JSON. Requires `FIGMA_ACCESS_TOKEN` and `FIGMA_FILE_KEY` env vars.

2. **Build** — `pnpm build-tokens`
   Runs Style Dictionary over the token JSON and emits:
   - `packages/tokens/css/` — CSS custom properties (base, dark mode, responsive)
   - `packages/tokens/js/` — ES module token constants + TypeScript declarations
   - `packages/tokens/tailwind/` — Tailwind theme preset

3. **Drift check** — `pnpm drift-check`
   Fetches current Figma variable values via the REST API and compares them against the committed token JSON. Reports mismatches. Runs automatically on pull requests in CI.

---

## Environment setup

**Prerequisites:** Node >= 20, pnpm >= 9.15.2

1. Copy `.env.example` to `.env` and fill in your values:
   ```
   FIGMA_ACCESS_TOKEN=<your Figma personal access token>
   FIGMA_FILE_KEY=bmFwMCXLLT9SKrsm1aDijr
   ```

2. Install dependencies:
   ```sh
   pnpm install
   ```

3. Build tokens (required before any other build):
   ```sh
   pnpm build-tokens
   ```

---

## Adding a new component

After scaffolding a new component under `packages/react/src/components/`, you must build the package before the sandbox (or any other consumer) can import it:

```sh
pnpm --filter @origin/react build
```

The sandbox resolves `@origin/react` from `packages/react/dist/`, which is not committed and is not rebuilt automatically. During active component development, run the watch mode instead so `dist/` stays current automatically:

```sh
pnpm --filter @origin/react dev   # runs tsc --watch
```

You can leave this running in a background terminal alongside `pnpm sandbox` or `pnpm storybook`.

---

## Common workflows

| Command | Description |
|---|---|
| `pnpm dev` | Start all packages in watch mode |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm storybook` | Run Storybook dev server at http://localhost:6006 |
| `pnpm sandbox` | Run the sandbox app at http://localhost:5173 |
| `pnpm build` | Build everything |
| `pnpm typecheck` | Type-check everything |
| `pnpm sync-tokens` | Sync variables from Figma (requires Figma desktop + plugin running) |
| `pnpm build-tokens` | Compile token JSON to CSS/JS/Tailwind outputs |
| `pnpm drift-check` | Compare Figma variables against committed tokens |
| `pnpm audit` | Run quality audits (token health, component checklist) |

---

## CI (GitHub Actions)

Two workflow files live in `.github/workflows/`. Both are currently set to manual dispatch (`workflow_dispatch`) rather than automatic triggers.

- **`ci.yml`** — Runs on demand: build-tokens, typecheck, unit tests, Storybook build, Playwright a11y tests, and drift-check on pull requests.
- **`sync-tokens.yml`** — Parked for future use. Token sync requires the Figma Console MCP Desktop Bridge plugin which is desktop-only; automated CI sync via the Figma Enterprise REST API is a future consideration.

To run CI manually: Actions tab in GitHub > select workflow > Run workflow.

---

## Claude Code integration

This repo is configured to work with Claude Code (Anthropic's AI coding assistant).

- **`.mcp.json`** — Registers the Storybook MCP server (`http://localhost:6006/mcp`) so Claude Code can inspect component APIs and stories at runtime. Start Storybook before using any Storybook-related Claude commands.
- **`.claude/`** — Workspace metadata, memory, and skills for Claude Code sessions.

Available skills (invoke with `/` in Claude Code):

| Skill | Description |
|---|---|
| `/sync-tokens` | Pull variables from Figma and rebuild token outputs |
| `/drift-check` | Compare Figma variables against committed token JSON |
| `/token-audit` | Audit token health (missing mappings, unused tokens, etc.) |
| `/a11y-check` | WCAG 2.1 AA accessibility audit on a component |
| `/figma-annotate` | Propose and write implementation annotations to a Figma component set |

---

## Key technologies

| Technology | Role |
|---|---|
| pnpm + Turborepo | Monorepo package management and task orchestration |
| TypeScript 5.7 | Strict mode throughout |
| React 18 | Component library target |
| Tailwind CSS 3.4 | Utility-first styling (configured via `@origin/tokens` preset) |
| Class Variance Authority (CVA) | Component variant management |
| Style Dictionary 4 | Token compilation (JSON to CSS/JS) |
| Storybook 10.3 | Component catalog and documentation |
| Vitest + Testing Library + jest-axe | Unit and accessibility tests |
| Playwright | Storybook a11y test runner |
| Figma Console MCP | Desktop Bridge plugin for Figma variable extraction |
