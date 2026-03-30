import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Badge } from "./Badge.js";

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A compact label used to convey status, category, or count. " +
          "Renders as a `<span>` by default (decorative). " +
          "Provide an `onClick` handler to make it an interactive `<button>` — " +
          "clickable badges gain hover, active, and focus-ring states driven by " +
          "T3 component badge colour tokens and T3 badge focus geometry tokens. " +
          "Six variants cover neutral, brand, and the four utility statuses.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "brand", "success", "error", "warning", "info"],
      description: "Colour variant — maps to T3 `badge/*` component colour tokens (`badge-color.light/dark.json`).",
    },
    onClick: {
      description:
        "When provided, renders a `<button>` with interactive states. Omit for a decorative `<span>`.",
    },
    disabled: {
      control: "boolean",
      description: "Only applies when `onClick` is supplied.",
    },
  },
  args: {
    children: "Badge",
    variant: "neutral",
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ─── All variants (static) ────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: "All Variants",
  parameters: {
    docs: {
      description: {
        story: "Static (non-clickable) badges across all six colour variants.",
      },
    },
  },
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--space-gap-xs)", flexWrap: "wrap" }}>
      <Badge {...args} variant="neutral">Neutral</Badge>
      <Badge {...args} variant="brand">Brand</Badge>
      <Badge {...args} variant="success">Success</Badge>
      <Badge {...args} variant="error">Error</Badge>
      <Badge {...args} variant="warning">Warning</Badge>
      <Badge {...args} variant="info">Info</Badge>
    </div>
  ),
};

// ─── Clickable ────────────────────────────────────────────────────────────────

export const Clickable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Providing `onClick` promotes the badge to a `<button>`. " +
          "Hover and active states use deeper shades from the badge token scale. " +
          "The focus ring uses T2 `border/focus` colour and T3 badge focus geometry.",
      },
    },
  },
  args: {
    onClick: fn(),
    children: "Clickable",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = canvasElement;
    const badge = canvas.getByRole("button", { name: "Clickable" });
    await userEvent.click(badge);
    expect(args.onClick).toHaveBeenCalledOnce();
  },
};

// ─── All clickable variants ───────────────────────────────────────────────────

export const ClickableVariants: Story = {
  name: "Clickable Variants",
  parameters: {
    docs: {
      description: {
        story: "All six variants as interactive buttons.",
      },
    },
  },
  render: (args) => {
    const handleClick = fn();
    return (
      <div style={{ display: "flex", gap: "var(--space-gap-xs)", flexWrap: "wrap" }}>
        <Badge {...args} variant="neutral" onClick={handleClick}>Neutral</Badge>
        <Badge {...args} variant="brand" onClick={handleClick}>Brand</Badge>
        <Badge {...args} variant="success" onClick={handleClick}>Success</Badge>
        <Badge {...args} variant="error" onClick={handleClick}>Error</Badge>
        <Badge {...args} variant="warning" onClick={handleClick}>Warning</Badge>
        <Badge {...args} variant="info" onClick={handleClick}>Info</Badge>
      </div>
    );
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    docs: {
      description: {
        story: "A disabled clickable badge — pointer-events removed, opacity reduced.",
      },
    },
  },
  args: {
    onClick: fn(),
    disabled: true,
    children: "Disabled",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = canvasElement;
    const badge = canvas.getByRole("button", { name: "Disabled" });
    expect(badge).toBeDisabled();
    await userEvent.click(badge);
    expect(args.onClick).not.toHaveBeenCalled();
  },
};

// ─── Focus ───────────────────────────────────────────────────────────────────
// Wrapper padding prevents the 2 px outline-offset being clipped.

export const Focus: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Focus ring driven by T3 badge focus tokens (width, offset) and T2 `border/focus` colour. " +
          "The fully-rounded outline automatically follows the pill shape.",
      },
    },
  },
  render: (args) => (
    <div style={{ padding: "8px" }}>
      <Badge {...args} onClick={fn()} autoFocus>
        Focused
      </Badge>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const badge = canvas.getByRole("button", { name: "Focused" });
    badge.focus();
    expect(badge).toHaveFocus();
  },
};

// ─── Keyboard interaction ─────────────────────────────────────────────────────

export const KeyboardInteraction: Story = {
  name: "Keyboard Interaction",
  parameters: {
    docs: {
      description: {
        story: "Clickable badge responds to Space and Enter keystrokes.",
      },
    },
  },
  args: {
    onClick: fn(),
    children: "Press me",
  },
  play: async ({ canvasElement, args }) => {
    const canvas = canvasElement;
    const badge = canvas.getByRole("button", { name: "Press me" });
    badge.focus();
    await userEvent.keyboard(" ");
    expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard("{Enter}");
    expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
