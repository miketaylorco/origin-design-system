---
description: Pull variables from Figma, rebuild token outputs, and summarise what changed
allowed-tools: Bash(pnpm *), Bash(git diff --stat *), Bash(git diff *), Bash(cat *), Bash(echo *), mcp__figma-console__figma_get_status, mcp__figma-console__figma_execute, Read, Write
---

Sync the design tokens from Figma into the codebase, then rebuild all token outputs.

## Prerequisites

Check `figma_get_status`. If the bridge isn't reachable, stop and tell the user to open Figma
desktop, open the Origin Design System file, and run the Figma Console MCP plugin.

## Steps

### 1. Read extraction constants

Read `scripts/sync-tokens.ts` and extract the **exact string content** (verbatim, no changes) of
these three exported constants:

- `RESET_CODE` — clears stale state in the Figma global
- `EXTRACTION_CODE` — fires the async variable extraction; stores result in `figma.__syncTokens*`
- `RETRIEVE_CODE` — synchronously returns the stored result (or null if not ready yet)

The template-literal delimiters (`` ` ``) are TypeScript — pass only the string content between
them to `figma_execute`.

### 2. Reset state

Call `figma_execute(RESET_CODE)`. This clears any result left over from a previous run.

### 3. Start extraction

Call `figma_execute(EXTRACTION_CODE)` with a 30 s timeout.

`figma_execute` does **not** await Promise returns, so this call will return `{"success":true}`
with no data — that is expected. The async work runs in the background and stores its result in
`figma.__syncTokensResult`.

### 4. Retrieve result

Call `figma_execute(RETRIEVE_CODE)`.

- If the result contains the token data object → proceed to step 5.
- If the result is `null` → the async work hasn't finished yet. Wait a moment and call
  `figma_execute(RETRIEVE_CODE)` again. Retry up to **5 times**. If still null after 5 tries,
  stop and report a timeout error.
- If `figma_execute` throws → the extraction errored. Report the error message and stop.

The token data is a JS object keyed by `"tier/filename"` (e.g. `"semantic/color.light"`).

### 5. Write raw result to temp file

Use the **Write tool** to write the token data object as JSON to `/tmp/origin-tokens-raw.json`.
JSON.stringify the object (compact is fine — it will be pretty-printed when token files are written).

### 6. Write token files

Run:
```
pnpm exec tsx scripts/sync-tokens.ts < /tmp/origin-tokens-raw.json
```

This writes one JSON file per key into `tokens/`. Report how many files were written.

### 7. Rebuild token outputs

Run `pnpm build-tokens`. This regenerates CSS custom properties, JS constants, and the Tailwind
preset from the updated token files. If the build fails, show the error and diagnose it.

### 8. Show a diff summary

Run `git diff --stat tokens/` then `git diff tokens/`. Summarise what changed:

- **T1 Primitive** (`tokens/primitive/`) — raw scale changes
- **T2 Semantic** (`tokens/semantic/`) — value or alias changes
- **T3 Component** (`tokens/component/`) — component token changes

For each changed token: was it a value change, a new token, or a removed token?
Flag anything unexpected (a token that disappeared, a raw value that used to be an alias, etc.).

### 9. Summarise impact

- Which CSS custom properties changed in `packages/tokens/css/`?
- Does anything look unintentional vs a deliberate design update?
- Are there any new tokens in `tokens/` not yet referenced in any component?

Keep the summary concise — one line per changed token is enough unless something needs explanation.
