---
description: Run a WCAG 2.1 AA accessibility audit on a single component — semantics, ARIA, keyboard, contrast tokens, and test coverage
allowed-tools: Read, Grep, Glob, Bash(pnpm add *), Bash(pnpm --filter * test -- *), Write
---

Run a WCAG 2.1 AA accessibility audit on the `$ARGUMENTS` component.

## Steps

### 1. Locate the component files

Use Glob to find:
- `packages/react/src/components/$ARGUMENTS/$ARGUMENTS.tsx` — implementation
- `packages/react/src/components/$ARGUMENTS/$ARGUMENTS.test.tsx` — tests
- `packages/react/src/components/$ARGUMENTS/$ARGUMENTS.stories.tsx` — stories

Read all three. If the component doesn't exist, stop and list available components under `packages/react/src/components/`.

### 2. Detect the component role

From the source, identify the underlying HTML element or ARIA role (e.g. `<button>`, `<input>`, `<dialog>`, `<a>`, `role="menu"`). This determines which WCAG success criteria are in scope.

### 3. Audit the implementation

Work through the checklist below. For each criterion mark it ✅ pass, ⚠️ warn, or ❌ fail, and quote the relevant source line(s).

#### Semantic HTML (WCAG 1.3.1, 4.1.2)
- Is the correct HTML element used for the component's purpose? (`<button>` for actions, `<a>` for navigation, `<input>` for data entry, etc.)
- Are any `role` overrides present? If so, are they necessary and correct?
- Are `div`/`span` elements used where a native element would be more appropriate?

#### Accessible name (WCAG 4.1.2, 2.4.6)
- Does every rendered instance have a way to receive an accessible name? (`aria-label`, `aria-labelledby`, `children`, or `title`)
- If the component supports icon-only usage (no visible text children), is there a required `aria-label` prop or a visible label alternative?
- Check: does passing no `children` and no `aria-label` produce an unnamed control?

#### State communication (WCAG 4.1.2)
- Loading → `aria-busy="true"` present?
- Disabled → native `disabled` attribute (preferred) or `aria-disabled="true"` with `pointer-events: none`?
- Expanded/collapsed (for toggles, dropdowns) → `aria-expanded` toggled correctly?
- Selected/checked → `aria-selected` or `aria-checked` where relevant?
- Any decorative icons or spinners → `aria-hidden="true"`?

#### Keyboard interaction (WCAG 2.1.1, 2.1.2)
- Is the element natively focusable, or does it have `tabIndex` set appropriately?
- For `<button>`: Enter and Space both trigger the action (native behaviour — verify nothing suppresses it).
- For custom interactive elements: are `onKeyDown`/`onKeyUp` handlers present for the expected keys?
- Is focus ever trapped or lost unexpectedly (e.g. after a loading state resolves)?
- Is `disabled:pointer-events-none` paired with the native `disabled` attribute so keyboard users also can't activate it?

#### Focus visibility (WCAG 2.4.7, 2.4.11)
- Is there a `focus-visible:ring-*` or equivalent class applied?
- Is the ring suppressed on mouse click via `focus-visible:` (correct) vs `:focus` (incorrect — would show ring on click too)?
- Use Grep to check: `grep -n "focus-visible" packages/react/src/components/$ARGUMENTS/$ARGUMENTS.tsx`

#### Colour token usage — contrast (WCAG 1.4.3, 1.4.11)
- Does the component use semantic interaction tokens (`var(--interaction-*-text-*)`, `var(--interaction-*-background-*)`) rather than primitive tokens or hardcoded colours?
- Use Grep to check for any hardcoded hex, `rgb(`, or primitive token references (`var(--brand-`, `var(--neutral-`) in the component source.
- Flag any `disabled` state tokens — disabled text is exempt from contrast requirements under WCAG, but note this explicitly.
- Note: actual contrast ratios require visual tooling (Storybook a11y addon or browser DevTools). Flag tokens that map to known low-contrast pairs if detectable from `tokens/semantic/color.light.json` and `tokens/semantic/color.dark.json`.

#### Touch target size (WCAG 2.5.5 — AA target: 44×44px)
- Check the size variants. For each, estimate the rendered height:
  - `sm` → `h-8` = 32px ⚠️ (below 44px — note this is a common exception for compact UIs; recommend pairing with sufficient padding or flagging as known exception)
  - `md` → `h-10` = 40px ⚠️ (just below threshold)
  - `lg` → `h-12` = 48px ✅
- Note: WCAG 2.5.5 is AA, 2.5.8 (24×24px) is the minimum. Flag sm/md as warnings unless the component documents the exception.

#### Motion / animation (WCAG 2.3.3 — AAA, but worth noting)
- If the component has animated transitions (`transition-*`, `animate-*`), check whether they respect `prefers-reduced-motion`. If not, flag as a recommendation.

### 4. Audit the test file

Check for the following test coverage and note any gaps:

- [ ] **Axe scan** — is `jest-axe` or `axe-core` used? If not, flag as missing.
- [ ] **Accessible name** — does at least one test use `getByRole('button', { name: '...' })` (which validates the accessible name exists)?
- [ ] **Disabled state** — `toBeDisabled()` assertion present?
- [ ] **Loading/busy state** — `aria-busy` assertion present?
- [ ] **Keyboard activation** — Enter and/or Space key test present?
- [ ] **Icon-only variant** — if the component supports it, is there a test that an `aria-label` is required/present?

### 5. Audit the stories file

Check:
- Are there stories covering all interactive states: default, hover (where possible), disabled, loading, icon-only?
- Are any `parameters.a11y.disable` overrides present? If so, flag each one — note whether it appears intentional (with a comment explaining why) or accidental.
- Is there at least one story that will exercise the focus ring (e.g. a story with `autoFocus` or a note to test keyboard navigation)?

### 6. jest-axe coverage — offer to add

If no axe-core scan is found in the test file:

1. Check whether `jest-axe` is installed: Grep for `"jest-axe"` in `packages/react/package.json`.
2. If not installed, show the install command:
   ```
   pnpm add -D jest-axe @types/jest-axe --filter @origin/react
   ```
   Ask the user whether to run it before proceeding.
3. If installed (or after install), offer to add an axe test to the existing test file. The test should follow this pattern, adapted to the component:

   ```tsx
   import { axe, toHaveNoViolations } from 'jest-axe';
   expect.extend(toHaveNoViolations);

   it('has no axe violations', async () => {
     const { container } = render(<Button>Click me</Button>);
     expect(await axe(container)).toHaveNoViolations();
   });
   ```

   If the user confirms, use Write to append the test — do not overwrite the existing file.

### 7. Run the axe tests

If jest-axe tests are present in the test file (either pre-existing or just added), run them:

```
pnpm --filter @origin/react test -- $ARGUMENTS
```

- If all tests pass, note that the axe scan is clean and include it as a ✅ in the report.
- If axe tests fail, quote the violation output verbatim — axe reports the rule ID, impact level, and the offending HTML. Add each violation to the **Failures** section of the report.
- If unrelated tests fail, note them separately as "test failures outside a11y scope" and do not let them affect the WCAG verdict.

### 8. Report

Group findings into three sections:

**Passes** — list ✅ items briefly (one line each).

**Warnings** ⚠️ — items that are not outright failures but need attention or documentation (e.g. touch target size exceptions, disabled contrast exemptions).

**Failures** ❌ — items that violate WCAG 2.1 AA. For each:
- The criterion number and name
- What was found
- A concrete fix (code snippet where possible)

End with an overall verdict:
- ✅ **Passes WCAG 2.1 AA** — no failures detected
- ⚠️ **Passes with caveats** — N warnings, no hard failures; recommended improvements listed
- ❌ **Fails WCAG 2.1 AA** — N violations found; fix the listed items before shipping
