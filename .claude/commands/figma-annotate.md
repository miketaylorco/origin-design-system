---
description: Analyse a component for implementation details invisible in Figma, propose annotations, confirm with the user, then write them to the Figma component set
allowed-tools: Read, Glob, Grep, mcp__figma-console__figma_execute, mcp__figma-console__figma_get_annotations, mcp__figma-console__figma_set_annotations, mcp__figma-console__figma_get_annotation_categories, mcp__figma-console__figma_capture_screenshot, mcp__figma-console__figma_reconnect
---

Analyse the `$ARGUMENTS` component for implementation behaviour that is difficult or impossible to communicate through static Figma design, propose Figma annotations, confirm with the user, then apply them.

## What annotations are for

Figma annotations surface implementation details — ARIA attributes, keyboard behaviour, token constraints, prop rules — that cannot be shown in a static comp. They are read by developers (and AI) during handoff. A good annotation answers "how should this behave in code?" not "what does it look like?".

Annotate pragmatically: one annotation per cross-cutting concern, placed on the most illustrative variant. Do not repeat the same annotation across every variant.

## Steps

### 1. Load the Button annotations as a reference pattern

Load the Button page in Figma and fetch its existing annotations:

```javascript
await figma.loadAllPagesAsync();
const buttonPage = figma.root.children.find(p => p.name === 'Button');
await figma.setCurrentPageAsync(buttonPage);
const buttonSet = buttonPage.findOne(n => n.type === 'COMPONENT_SET');
const annotations = await buttonPage.getAnnotationsAsync();
```

Note the label style and description format so the new annotations are consistent.

If the Desktop Bridge is not connected, tell the user to reopen the Figma Console MCP plugin, then call `figma_reconnect` before continuing.

### 2. Read the component source files

Use Glob to locate:
- `packages/react/src/components/$ARGUMENTS/$ARGUMENTS.tsx` — implementation
- `packages/react/src/components/$ARGUMENTS/$ARGUMENTS.test.tsx` — tests (reveals behaviour not in the component file)

Read both. If the component doesn't exist, stop and list available components under `packages/react/src/components/`.

### 3. Identify annotation candidates

Work through each category below. For each candidate, draft:
- **Label** — short heading (≤ 6 words)
- **Description** — 1–3 sentences. Explain the *why* as well as the *what*. Include the exact attribute name, prop name, or CSS class where relevant.
- **Placement** — which variant to attach it to (be specific: e.g. "State=Error, Has helper text=false")
- **Justification** — why a designer or developer couldn't infer this from the visual alone

#### ARIA attributes
- Any `aria-*` attributes set dynamically (e.g. `aria-invalid`, `aria-describedby`, `aria-live`, `aria-expanded`)?
- Are they set conditionally based on props? Note the prop that triggers them.
- Does `aria-describedby` reference IDs generated at runtime? Note the ID pattern.

#### Keyboard and focus behaviour
- Is focus visibility limited to keyboard users (`focus-visible:`) or also shown on mouse click (`:focus`)?
- Are any keys handled beyond the native element defaults?
- Does the focus ring geometry come from component tokens? If so, name them.

#### Prop constraints and combinations
- Are any prop combinations meaningful that Figma can't show? (e.g. helper text and error message coexist — one never suppresses the other)
- Are there props that change behaviour without changing appearance? (e.g. `readOnly` vs `disabled` — both look similar but behave differently for form submission and clipboard)

#### Token-driven geometry
- Does any geometry (padding, radius, font-size, focus ring) come from T3 component tokens rather than being hardcoded? Note the token names so developers know where to find and change them.
- Is colour driven exclusively by T2 semantic tokens? Note this so developers don't reach for primitives.

#### Motion / reduced-motion
- Is `motion-reduce:transition-none` or equivalent present? If so, note which transitions are suppressed.

#### ID and labelling
- Are IDs auto-generated (e.g. via `useId()`)? Can callers override them? Note when an explicit `id` prop is needed (e.g. when the field must be referenced by an external `<label>`).

### 4. Filter and prioritise

Remove candidates that:
- Are obvious from the visual design alone
- Are already captured in an existing annotation (check the annotations fetched in step 1)
- Are too implementation-specific to be useful during handoff (e.g. internal hook names)

Order the remaining candidates from most impactful to least.

### 5. Present the proposed annotations and ask for confirmation

Present the proposals as a numbered list in this format:

```
**[N] Label**
Variant: State=X, Has helper text=Y
Description: ...
```

Then ask:
> "Should I add all of these annotations to the $ARGUMENTS component in Figma? You can also tell me to skip specific numbers or adjust the wording."

**Do not make any Figma changes until the user confirms.**

### 6. Apply the confirmed annotations

#### Annotation API — correct format

Annotations are set via the plugin API using `node.annotations`. The field is a plain writable property, not an async method. The correct object shape is:

```javascript
node.annotations = [{ labelMarkdown: 'Your **markdown** text here.\nLine 2.' }];
```

**Critical rules:**
- Use `labelMarkdown` only — do NOT include `label` alongside it (Figma rejects `{ label, labelMarkdown }` as invalid).
- There is no `description` field — the full content goes in `labelMarkdown`.
- Markdown is supported: `**bold**`, `` `code` ``, `\n` for line breaks, `- item` for lists.
- Annotate the most specific sub-node relevant to the note (e.g. the `input` FRAME for ARIA attributes, the `error-text` TEXT node for aria-live, the `focus-ring` RECTANGLE for focus behaviour). This places the annotation pin close to the relevant element in Figma's Dev Mode.

For each confirmed annotation:

1. Navigate to the `$ARGUMENTS` Figma page with `figma.setCurrentPageAsync`.
2. Find the component set: `page.findOne(n => n.type === 'COMPONENT_SET')`.
3. Find the target variant by name: `cs.children.find(c => c.name === 'State=X, ...')`.
4. Find the target sub-node: `variant.findOne(n => n.name === 'input')` (or whichever node).
5. Get the node by ID (more reliable after IDs are known): `await figma.getNodeByIdAsync(id)`.
6. Set the annotation: `node.annotations = [{ labelMarkdown: text }]`.

Apply all annotations in a single `figma_execute` call where possible before taking a screenshot.

### 7. Screenshot and confirm

Use `figma_capture_screenshot` with the component set node ID to capture the result. Include it in your response so the user can verify placement.

### 8. Report

List every annotation applied:
- Variant it was attached to
- Node within the variant
- Label and description (truncated if long)

Note any proposals that were skipped (by user request or because they already existed).
