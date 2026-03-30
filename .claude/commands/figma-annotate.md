---
description: Analyse a component for implementation details invisible in Figma, propose annotations, confirm with the user, then write them to instances of the Figma component set
allowed-tools: Read, Glob, Grep, mcp__figma-console__figma_execute, mcp__figma-console__figma_get_annotations, mcp__figma-console__figma_set_annotations, mcp__figma-console__figma_get_annotation_categories, mcp__figma-console__figma_capture_screenshot, mcp__figma-console__figma_reconnect
---

Analyse the `$ARGUMENTS` component for implementation behaviour that is difficult or impossible to communicate through static Figma design, propose Figma annotations, confirm with the user, then apply them.

## What annotations are for

Figma annotations surface implementation details — ARIA attributes, keyboard behaviour, token constraints, prop rules — that cannot be shown in a static comp. They are read by developers (and AI) during handoff. A good annotation answers "how should this behave in code?" not "what does it look like?".

Annotate pragmatically: one annotation per cross-cutting concern, placed on the most illustrative instance. Do not repeat the same annotation across every instance.

## Why annotations go on instances, not variants

Annotations are attached to component variants (the source of truth). Plugins like Propstar that regenerate component specs overwrite the component set and its variants, destroying all annotations. By attaching annotations to **instances** of the component in a dedicated "Annotations" frame, annotations survive component set regeneration. Instances are never touched by spec plugins.

## Steps

### 1. Load the Button annotations as a reference pattern

Load the Button page in Figma and fetch its existing annotations from the Annotations frame:

```javascript
await figma.loadAllPagesAsync();
const buttonPage = figma.root.children.find(p => p.name === 'Button');
await figma.setCurrentPageAsync(buttonPage);
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
- **Variant state** — which variant state to show this on (e.g. "State=Error, Has helper text=false")
- **Target node** — which sub-node within the instance to pin the annotation to
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
Variant state: State=X, Has helper text=Y
Target node: input / error-text / focus-ring / etc.
Description: ...
```

Then ask:
> "Should I add all of these annotations to the $ARGUMENTS component in Figma? You can also tell me to skip specific numbers or adjust the wording."

**Do not make any Figma changes until the user confirms.**

### 6. Apply the confirmed annotations

Annotations are placed on **instances** of the component, not on the component variants themselves. This protects annotations from being wiped when spec-generation plugins (e.g. Propstar) regenerate the component set.

#### Setting up the Annotations frame

Before placing any instance, find or create an "Annotations" frame on the component page:

```javascript
await figma.loadAllPagesAsync();
const page = figma.root.children.find(p => p.name === '$ARGUMENTS');
await figma.setCurrentPageAsync(page);

// Find or create the Annotations frame
let annotationsFrame = page.findOne(n => n.type === 'FRAME' && n.name === 'Annotations');
if (!annotationsFrame) {
  annotationsFrame = figma.createFrame();
  annotationsFrame.name = 'Annotations';
  annotationsFrame.layoutMode = 'HORIZONTAL';
  annotationsFrame.counterAxisAlignItems = 'MIN';
  annotationsFrame.itemSpacing = 48;
  annotationsFrame.paddingTop = 48;
  annotationsFrame.paddingBottom = 48;
  annotationsFrame.paddingLeft = 48;
  annotationsFrame.paddingRight = 48;
  annotationsFrame.counterAxisSizingMode = 'AUTO';
  annotationsFrame.primaryAxisSizingMode = 'AUTO';
  annotationsFrame.fills = [];

  // Position: align with the top of the main component container,
  // 1500px to its right.
  const cs = page.findOne(n => n.type === 'COMPONENT_SET');
  let container = cs?.parent;
  while (container && container.parent !== page) container = container.parent;
  annotationsFrame.x = (container?.x ?? 0) + (container?.width ?? 0) + 1500;
  annotationsFrame.y = container?.y ?? 0;
}
```

#### Creating instances for each annotation

For each annotation, create a separate instance set to the correct variant state:

```javascript
// Find the component set
const componentSet = page.findOne(n => n.type === 'COMPONENT_SET');

// Create an instance from the default variant
const instance = componentSet.defaultVariant.createInstance();
annotationsFrame.appendChild(instance);

// Set the variant properties to the desired state
// e.g. for State=Error, Has helper text=false:
instance.setProperties({ State: 'Error', 'Has helper text': 'false' });

// Resize the frame to hug its new child
annotationsFrame.primaryAxisSizingMode = 'AUTO';
annotationsFrame.counterAxisSizingMode = 'AUTO';
```

#### Attaching the annotation to the correct sub-node

Find the target sub-node within the instance and set the annotation:

```javascript
// Find the target sub-node inside the instance
const targetNode = instance.findOne(n => n.name === 'input'); // or 'error-text', 'focus-ring', etc.
const annotationTarget = targetNode ?? instance;

annotationTarget.annotations = [{
  labelMarkdown: '**Label**\nDescription text here.\n- detail 1\n- detail 2'
}];
```

#### Annotation API — correct format

```javascript
node.annotations = [{ labelMarkdown: 'Your **markdown** text here.\nLine 2.' }];
```

**Critical rules:**
- Use `labelMarkdown` only — do NOT include `label` alongside it (Figma rejects `{ label, labelMarkdown }` as invalid).
- There is no `description` field — the full content goes in `labelMarkdown`.
- Markdown is supported: `**bold**`, `` `code` ``, `\n` for line breaks, `- item` for lists.
- Annotate the most specific sub-node relevant to the note (e.g. the `input` FRAME for ARIA attributes, the `error-text` TEXT node for aria-live, the `focus-ring` RECTANGLE for focus behaviour). This places the annotation pin close to the relevant element in Figma's Dev Mode.
- If `findOne` doesn't find the sub-node by name, fall back to annotating the instance root itself.

Apply all annotations in a single `figma_execute` call where possible before taking a screenshot.

### 7. Screenshot and confirm

Use `figma_capture_screenshot` with the Annotations frame node ID to capture the result. Include it in your response so the user can verify placement.

### 8. Report

List every annotation applied:
- Instance variant state
- Node within the instance
- Label and description (truncated if long)

Note any proposals that were skipped (by user request or because they already existed).
