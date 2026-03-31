import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { Avatar, type AvatarColor } from "./Avatar.js";

const COLORS: AvatarColor[] = [
  "neutral", "lilac", "rose", "sunset", "honey", "lime",
  "emerald", "aqua", "cerulean", "blue", "purple",
];

const meta = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A circular container representing a user or entity. " +
          "Three display modes: `image` renders a photo, `icon` shows the user icon, " +
          "`initials` shows up to two characters. " +
          "Three sizes (`sm`/`md`/`lg`) and eleven colour options (driven by T3 " +
          "`avatar-color.light.json` tokens aliasing T1 brand primitive palettes). " +
          "Add an `onClick` to make it interactive — gains keyboard support and a " +
          "focus ring using T3 `avatar` focus geometry tokens.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    display: {
      control: "select",
      options: ["image", "icon", "initials"],
      description: "Display mode. `image` requires `src` + `alt`. `initials` requires `initials`.",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Size variant — maps to T3 `avatar/size/{sm|md|lg}` tokens (32/40/56 px).",
    },
    color: {
      control: "select",
      options: COLORS,
      description:
        "Colour palette for icon and initials display modes. " +
        "Maps to T3 `avatar/{color}/background` and `avatar/{color}/foreground` tokens " +
        "(100-shade background, 700-shade foreground from T1 brand primitives). " +
        "`neutral` aliases `background.subdued` / `text.subdued` (T2).",
    },
    src: { control: "text", description: "Image URL — required when `display=\"image\"`." },
    alt: { control: "text", description: "Alt text — required when `display=\"image\"`." },
    initials: {
      control: "text",
      description: "1–2 character string — required when `display=\"initials\"`. Truncated and uppercased automatically.",
    },
    onClick: {
      description:
        "Click handler. When provided the avatar is interactive: gains `role=\"button\"`, " +
        "keyboard activation (Enter / Space), and a focus ring.",
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Display modes ────────────────────────────────────────────────────────────

export const Image: Story = {
  args: {
    display: "image",
    src: "https://i.pravatar.cc/150?img=47",
    alt: "Jane Smith",
    size: "md",
  },
};

export const Icon: Story = {
  args: {
    display: "icon",
    size: "md",
    color: "cerulean",
    "aria-label": "User profile",
  },
};

export const Initials: Story = {
  args: {
    display: "initials",
    initials: "JS",
    size: "md",
    color: "rose",
    "aria-label": "Jane Smith",
  },
};

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar display="initials" initials="AB" size="sm" color="blue" aria-label="AB" />
      <Avatar display="initials" initials="AB" size="md" color="blue" aria-label="AB" />
      <Avatar display="initials" initials="AB" size="lg" color="blue" aria-label="AB" />
    </div>
  ),
};

// ─── Colour palette ───────────────────────────────────────────────────────────

export const ColourPaletteIcon: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((c) => (
        <Avatar key={c} display="icon" color={c} size="md" aria-label={c} />
      ))}
    </div>
  ),
};

export const ColourPaletteInitials: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      {COLORS.map((c) => (
        <Avatar key={c} display="initials" initials="AB" color={c} size="md" aria-label={c} />
      ))}
    </div>
  ),
};

// ─── Interactive ──────────────────────────────────────────────────────────────

export const Interactive: Story = {
  args: {
    display: "initials",
    initials: "MK",
    size: "md",
    color: "purple",
    "aria-label": "MK",
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const avatar = canvas.getByRole("button");
    await userEvent.click(avatar);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const InteractiveKeyboard: Story = {
  args: {
    display: "icon",
    size: "md",
    color: "emerald",
    "aria-label": "User profile",
    onClick: fn(),
  },
  play: async ({ args, canvas }) => {
    const avatar = canvas.getByRole("button");
    avatar.focus();
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(2);
  },
};
