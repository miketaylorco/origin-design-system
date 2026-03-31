import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Alert } from "./Alert.js";

const meta = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A banner alert used to communicate status messages to the user. " +
          "Four variants map to the four utility colour scales: `success`, `warning`, `error`, and `info`. " +
          "Each variant renders a leading icon, an optional bold title, and a message area that supports " +
          "HTML content (bold text, inline links, multi-line). " +
          "An optional dismiss button appears on the right when `onDismiss` is provided. " +
          "Colours come from T3 `alert-color.light/dark.json` tokens aliasing T2 utility semantic tokens. " +
          "Geometry (padding, radius, icon size) comes from T3 `alert.json` tokens.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["success", "warning", "error", "info"],
      description:
        "Colour variant — maps to T3 `alert/*` component colour tokens derived from T2 utility semantic tokens.",
    },
    title: {
      control: "text",
      description: "Optional bold title rendered above the message.",
    },
    message: {
      control: "text",
      description:
        "Alert message. Supports HTML strings (bold, inline links). Use `children` for React node content — when both are present, `children` takes precedence.",
    },
    onDismiss: {
      description:
        "When provided, renders a dismiss button on the right. Called when the button is clicked.",
    },
    dismissLabel: {
      control: "text",
      description: 'Accessible label for the dismiss button. Defaults to `"Dismiss"`.',
    },
  },
  args: {
    variant: "info",
    message: "This is an informational alert message.",
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ─── All variants ─────────────────────────────────────────────────────────────

export const AllVariants: Story = {
  name: "All Variants",
  parameters: {
    docs: {
      description: {
        story: "All four utility colour variants.",
      },
    },
  },
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-gap-sm)" }}>
      <Alert {...args} variant="info" message="Informational message for the user." />
      <Alert {...args} variant="success" message="Your changes have been saved successfully." />
      <Alert {...args} variant="warning" message="This action cannot be undone. Please review before continuing." />
      <Alert {...args} variant="error" message="An error occurred. Please try again." />
    </div>
  ),
};

// ─── With title ───────────────────────────────────────────────────────────────

export const WithTitle: Story = {
  name: "With Title",
  parameters: {
    docs: {
      description: {
        story: "An optional `title` prop adds a bold heading above the message.",
      },
    },
  },
  args: {
    variant: "warning",
    title: "Session expiring soon",
    message: "Your session will expire in 5 minutes. Save your work to avoid losing changes.",
  },
};

// ─── HTML message content ──────────────────────────────────────────────────────

export const HtmlMessage: Story = {
  name: "HTML Message",
  parameters: {
    docs: {
      description: {
        story:
          "The `message` prop renders as HTML, enabling <strong>bold text</strong> and inline links.",
      },
    },
  },
  args: {
    variant: "error",
    title: "Payment failed",
    message:
      'Your payment could not be processed. <strong>Card ending in 4242</strong> was declined. ' +
      'Please <a href="#" style="text-decoration:underline">update your payment method</a> and try again.',
  },
};

// ─── Multi-line message ────────────────────────────────────────────────────────

export const MultiLine: Story = {
  name: "Multi-line Message",
  parameters: {
    docs: {
      description: {
        story: "Long messages wrap naturally — the alert height grows with the content.",
      },
    },
  },
  args: {
    variant: "info",
    title: "Scheduled maintenance",
    message:
      "We will be performing scheduled maintenance on Saturday 5 April from 02:00 to 04:00 UTC. " +
      "During this window the service will be unavailable. " +
      "Please plan accordingly and save any in-progress work before the maintenance window begins.",
  },
};

// ─── Dismissible ──────────────────────────────────────────────────────────────

export const Dismissible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Providing `onDismiss` renders a close button on the right. " +
          "The button uses the T3 alert focus tokens for its focus ring.",
      },
    },
  },
  args: {
    variant: "success",
    title: "Profile updated",
    message: "Your profile changes have been saved.",
    onDismiss: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = canvasElement;
    const btn = canvas.getByRole("button", { name: "Dismiss" });
    await userEvent.click(btn);
    expect(args.onDismiss).toHaveBeenCalledOnce();
  },
};

// ─── Focus on dismiss button ──────────────────────────────────────────────────

export const DismissFocus: Story = {
  name: "Dismiss Focus",
  parameters: {
    docs: {
      description: {
        story: "Focus ring on the dismiss button, driven by T3 alert focus tokens.",
      },
    },
  },
  render: (args) => (
    <div style={{ padding: "8px" }}>
      <Alert {...args} />
    </div>
  ),
  args: {
    variant: "info",
    message: "Focus the dismiss button to see the focus ring.",
    onDismiss: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = canvasElement;
    const btn = canvas.getByRole("button", { name: "Dismiss" });
    btn.focus();
    expect(btn).toHaveFocus();
  },
};

// ─── React children ───────────────────────────────────────────────────────────

export const ReactChildren: Story = {
  name: "React Children",
  parameters: {
    docs: {
      description: {
        story:
          "When `children` is provided it takes precedence over the `message` prop, " +
          "enabling arbitrary React content in the message area.",
      },
    },
  },
  args: {
    variant: "warning",
    title: "Action required",
  },
  render: (args) => (
    <Alert {...args}>
      Please <strong>verify your email address</strong> within 48 hours to keep your account active.{" "}
      <a href="#" style={{ textDecoration: "underline" }}>Resend verification email</a>
    </Alert>
  ),
};
