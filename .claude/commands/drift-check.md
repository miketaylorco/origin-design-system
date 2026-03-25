---
description: Compare live Figma variables against committed token JSON and explain any discrepancies
allowed-tools: mcp__figma-console__figma_get_variables, Read, Glob
---

Compare the live Figma variables against the committed `tokens/` JSON and report any drift.

## Steps

### 1. Fetch variables from Figma

Call `figma_get_variables` with `resolveAliases: true` and `format: "full"`.

- The tool will use the REST API first. On a Pro plan this returns 403 — the tool will automatically fall back to a console snippet instead.
- If a console snippet is provided: show it to the user, ask them to paste it into **Plugins → Development → Open Console** in the Figma desktop app, then call `figma_get_variables` again with `parseFromConsole: true` to retrieve the results.
- If the Figma file isn't open or the Desktop Bridge isn't running, tell the user: open Figma desktop, open the Origin Design System file, and ensure the Figma Console MCP plugin is running.

### 2. Load the committed token values

Read the `tokens/` directory. Use `Glob` to find all JSON files under `tokens/primitive/`, `tokens/semantic/`, and `tokens/component/`, then `Read` each one. Build a flat map of every token: `collection/group/name → $value`.

### 3. Compare

For each variable returned from Figma:
- Normalise the name to match the token path convention used in `tokens/` (e.g. `brand/lime/100` → look for `brand/lime/100` in the flat map).
- Compare Figma's resolved value against the `$value` in the JSON (case-insensitive, strip whitespace).
- Track three categories:
  - **Drifted** — token exists in both but values differ
  - **New in Figma** — token exists in Figma but not in `tokens/`
  - **Removed from Figma** — token exists in `tokens/` but not in Figma

### 4. Report findings

Group results by tier:
- **T1 Primitive** (`tokens/primitive/`) — raw palette or scale changes; note that these affect every semantic alias that references them
- **T2 Semantic** (`tokens/semantic/`) — alias target or mode changes; note which UI contexts are affected
- **T3 Component** (`tokens/component/`) — component-specific token changes

For each drifted token:
- Show: token name | Figma value | code value
- Assess intent: does the Figma value look like a deliberate design update or an accidental edit?
- Recommend: **run `/sync-tokens`** if code should catch up, or **flag to designer** if Figma may have drifted accidentally

For new-in-Figma tokens: note they need a `/sync-tokens` run to pull them into code.

For removed-from-Figma tokens: flag them — they may need to be deleted from `tokens/` or the removal may be accidental.

### 5. Give a verdict

End with one of:
- ✅ **In sync** — no drift detected
- ⚠️ **Minor drift** — N tokens differ, recommended action: …
- ❌ **Significant drift** — N tokens differ across tiers, run `/sync-tokens` to reconcile
