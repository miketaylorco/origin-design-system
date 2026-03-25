---
description: Audit token health — missing dark-mode mappings, primitive leakage in components, and unused tokens
allowed-tools: Bash(pnpm *), Read, Grep
---

Run a full token health audit and give actionable findings.

## Steps

1. **Run the audit script** — `pnpm audit tokens`
   - This checks for missing dark-mode parity and primitive token leakage in components.

2. **Missing dark-mode mappings**

   If any semantic color tokens exist in `tokens/semantic/color.light.json` but not in `tokens/semantic/color.dark.json`:
   - List each one with its current light-mode value.
   - Suggest a sensible dark-mode value based on the token's name and semantic role (e.g. a `background/default` light value of a near-white gray should become a near-black gray in dark mode).
   - Note which UI elements will be affected if these stay unmapped (they'll inherit the light value in dark mode, causing contrast issues).

3. **Primitive token leakage**

   If any component source files reference primitive CSS variables directly (e.g. `var(--brand-lime-500)` instead of `var(--interaction-primary-background-default)`):
   - Identify the exact file and line using Grep.
   - Explain why this is a problem: primitives bypass the semantic layer, so design decisions (like changing the primary action color) won't propagate automatically.
   - Suggest the correct semantic token to use instead.

4. **Unused token check**

   After the script runs, do a quick manual check:
   - Use Grep to find all `var(--...)` references across `packages/react/src/**/*.tsx`.
   - Compare against the tokens defined in `packages/tokens/css/semantic-base.css`.
   - Call out any semantic tokens that are defined but never referenced by any component — these may be candidates to clean up or are tokens waiting to be used.

5. **Summary**

   End with a health score out of three:
   - ✅ Dark-mode parity complete
   - ✅ No primitive leakage
   - ✅ No unused semantic tokens

   For each ❌, give the count and the highest-priority item to fix first.
