import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button.js";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The foundational action component. Available in three variants " +
          "(primary, secondary, ghost) and three sizes (sm, md, lg). " +
          "All interactive states are driven by T2 Semantic interaction tokens. " +
          "The focus ring uses the T2 `border/focus` colour token and T3 button focus geometry tokens " +
          "(ring-width, ring-offset, ring-radius), rendered as a CSS outline so it adapts to each size's border radius.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost"],
      description: "Visual variant — maps to the T2 semantic interaction token set",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    loading: {
      control: "boolean",
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    children: "Button",
    variant: "primary",
    size: "md",
    loading: false,
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ─── All variants ─────────────────────────────────────────────────────────────

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--space-gap-sm)", flexWrap: "wrap" }}>
      <Button {...args} variant="primary">Primary</Button>
      <Button {...args} variant="secondary">Secondary</Button>
      <Button {...args} variant="ghost">Ghost</Button>
    </div>
  ),
};

// ─── All sizes ───────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--space-gap-sm)", alignItems: "center", flexWrap: "wrap" }}>
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="md">Medium</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: "var(--space-gap-sm)", flexWrap: "wrap" }}>
      <Button {...args} variant="primary" disabled>Primary</Button>
      <Button {...args} variant="secondary" disabled>Secondary</Button>
      <Button {...args} variant="ghost" disabled>Ghost</Button>
    </div>
  ),
};

// ─── Loading ─────────────────────────────────────────────────────────────────

export const Loading: Story = {
  args: { loading: true, children: "Saving…" },
};

// ─── Full width ──────────────────────────────────────────────────────────────

export const FullWidth: Story = {
  render: (args) => (
    <div style={{ width: 320 }}>
      <Button {...args} style={{ width: "100%" }}>Full width</Button>
    </div>
  ),
};

// ─── Focus ───────────────────────────────────────────────────────────────────
// autoFocus shows the token-driven focus ring (border/focus colour, 2px width,
// 2px offset). The wrapper padding prevents the outline being clipped.

export const Focus: Story = {
  render: (args) => (
    <div style={{ padding: "8px" }}>
      <Button {...args} autoFocus>Button</Button>
    </div>
  ),
};

