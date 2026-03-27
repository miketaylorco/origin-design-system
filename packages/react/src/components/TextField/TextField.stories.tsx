import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { TextField } from "./TextField.js";

const meta = {
  title: "Components/TextField",
  component: TextField,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Single-line text input with label, helper text, and error state. " +
          "All geometry is driven by T3 `text-field` component tokens. " +
          "Colours use T2 semantic tokens (`background/raised`, `border/subdued`, `utility/error`). " +
          "The focus ring matches the Button focus ring: `border/focus` colour with component-token geometry.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    helperText: { control: "text" },
    errorMessage: { control: "text" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: {
    label: "Email address",
    placeholder: "you@example.com",
    disabled: false,
    readOnly: false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: "8px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Default ─────────────────────────────────────────────────────────────────

export const Default: Story = {};

// ─── With helper text ────────────────────────────────────────────────────────

export const WithHelperText: Story = {
  args: {
    helperText: "We'll never share your email with anyone.",
  },
};

// ─── Error state ─────────────────────────────────────────────────────────────

export const ErrorState: Story = {
  args: {
    errorMessage: "Please enter a valid email address.",
  },
};

// ─── Error with helper text ───────────────────────────────────────────────────
// Both helper text and error message are shown simultaneously — helper text
// provides persistent context; the error message surfaces the specific problem.

export const ErrorWithHelperText: Story = {
  args: {
    helperText: "We'll never share your email.",
    errorMessage: "Please enter a valid email address.",
  },
};

// ─── Disabled ────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "user@example.com",
    onChange: fn(),
  },
};

// ─── Read-only ───────────────────────────────────────────────────────────────

export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "user@example.com",
    onChange: fn(),
  },
};

// ─── Typing interaction ───────────────────────────────────────────────────────
// Demonstrates the focus ring and typing flow.

export const TypingInteraction: Story = {
  args: {
    label: "Username",
    placeholder: "Enter your username",
    helperText: "Letters and numbers only.",
    onChange: fn(),
  },
  play: async ({ canvas, args }) => {
    const input = canvas.getByRole("textbox", { name: /username/i });
    await userEvent.click(input);
    await userEvent.type(input, "janedoe");
    await expect(input).toHaveValue("janedoe");
    await expect(args.onChange).toHaveBeenCalled();
  },
};

// ─── Error interaction ────────────────────────────────────────────────────────
// Verifies aria-invalid is set when errorMessage is present.

export const ErrorInteraction: Story = {
  args: {
    errorMessage: "This field is required.",
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: /email address/i });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    // Error message is associated via aria-describedby
    const descId = input.getAttribute("aria-describedby");
    const desc = canvas.getByText("This field is required.");
    await expect(desc).toHaveAttribute("id", descId!);
  },
};

// ─── Focus ────────────────────────────────────────────────────────────────────
// Shows the token-driven focus ring; wrapper padding prevents outline clipping.

export const Focus: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole("textbox", { name: /email address/i });
    input.focus();
    await expect(input).toHaveFocus();
  },
};
