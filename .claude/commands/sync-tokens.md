---
description: Pull variables from Figma, rebuild token outputs, and summarise what changed
allowed-tools: Bash(pnpm *), Bash(git diff --stat *), Bash(git diff *)
---

Sync the design tokens from Figma into the codebase, then rebuild all token outputs.

## Steps

1. **Run the sync** — `pnpm sync-tokens`
   - This connects to the Figma Desktop Bridge (the Figma Console MCP plugin must be running in the desktop app).
   - If the bridge isn't reachable, stop and explain how to start it: open Figma desktop, open the Origin Design System file, and run the Figma Console MCP plugin.

2. **Rebuild token outputs** — `pnpm build-tokens`
   - This runs Style Dictionary to regenerate all outputs: CSS custom properties, JS constants, and the Tailwind preset.
   - If the build fails, show the error and diagnose it.

3. **Show a diff summary** — `git diff --stat tokens/` then `git diff tokens/`
   - Summarise what actually changed. Group changes by tier:
     - **T1 Primitive** (`tokens/primitive/`) — raw palette or scale changes
     - **T2 Semantic** (`tokens/semantic/`) — alias or mode changes
     - **T3 Component** (`tokens/component/`) — component token changes
   - For each changed token, note: was it a value change, a new token, or a removed token?
   - Flag anything unexpected (e.g. a semantic token now pointing to a different primitive, a token that disappeared).

4. **Summarise the impact**
   - Which CSS custom properties changed in `packages/tokens/css/`?
   - Does anything look like an unintentional change vs a deliberate design update?
   - If there are new tokens in `tokens/` that aren't yet referenced in any component, call them out so they can be wired up.

Keep the summary concise — one line per changed token is enough unless something needs explanation.
