---
description: Pull icon SVGs from Figma and generate React icon components
allowed-tools: Bash(pnpm *), Bash(git diff --stat *), Bash(git diff *), mcp__figma-console__figma_get_status, mcp__figma-console__figma_execute, Read, Write
---

Sync icon components from the Figma Icons page into the React package, then rebuild.

## Prerequisites

Check `figma_get_status`. If the bridge isn't reachable, stop and tell the user to open Figma
desktop, open the Origin Design System file, and run the Figma Console MCP plugin.

## Steps

### 1. Read extraction constants

Read `scripts/sync-icons.ts` and extract the **exact string content** (verbatim, no changes) of
these three exported constants:

- `ICONS_RESET_CODE` — clears stale state in the Figma global
- `ICONS_EXTRACTION_CODE` — fires the async SVG extraction; stores result in `figma.__syncIcons*`
- `ICONS_RETRIEVE_CODE` — synchronously returns the stored result (or null if not ready yet)

The template-literal delimiters (`` ` ``) are TypeScript — pass only the string content between
them to `figma_execute`.

### 2. Reset state

Call `figma_execute(ICONS_RESET_CODE)`.

### 3. Start extraction

Call `figma_execute(ICONS_EXTRACTION_CODE)`.

`figma_execute` does **not** await Promise returns, so this call will return `{"success":true}`
with no data — that is expected. The async work runs in the background.

### 4. Retrieve result

Call `figma_execute(ICONS_RETRIEVE_CODE)`.

- If the result is an array → proceed to step 5.
- If the result is `null` → not finished yet. Retry up to **5 times**. If still null, stop
  and report a timeout error.
- If `figma_execute` throws → report the error and stop.

The result is a JSON array: `[{ name: string, svg: string }, ...]`

### 5. Write raw result to temp file

Use the **Bash tool** to write the icon data to `/tmp/origin-icons-raw.json` via a Python
one-liner (avoids heredoc escaping issues with SVG content):

```bash
python3 -c "import json,sys; json.dump(<RESULT_DATA>, open('/tmp/origin-icons-raw.json','w'))"
```

Replace `<RESULT_DATA>` with the actual Python-literal representation of the result array.

### 6. Generate icon components

Run:
```
pnpm exec tsx scripts/sync-icons.ts < /tmp/origin-icons-raw.json
```

This writes one `<Name>Icon.tsx` file per icon into `packages/react/src/components/icons/`
and regenerates the barrel `index.ts`.

### 7. Ensure icons are exported from the React package

Check `packages/react/src/index.ts`. If it does not already contain a line like:
```ts
export * from "./components/icons/index.js";
```
add it now.

### 8. Rebuild the React package

Run `pnpm build` in `packages/react/`. This compiles the new icon components to `dist/`.

### 9. Show a diff summary

Run `git diff --stat packages/react/src/components/icons/`. Summarise:

- Which icons are new (added), changed (SVG path updated), or removed.
- Flag anything unexpected — e.g. an icon that disappeared, or a viewBox that changed.

Keep the summary to one line per icon unless something needs explanation.
