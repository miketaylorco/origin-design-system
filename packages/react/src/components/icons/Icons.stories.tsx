import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AngleDownIcon,
  AngleUpIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CloseIcon,
  ErrorIcon,
  InfoIcon,
  SpinnerScaleIcon,
  SuccessIcon,
  UserIcon,
  WarningIcon,
} from "./index.js";

// ─── Icon registry ────────────────────────────────────────────────────────────

const icons: { name: string; component: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { name: "AngleDownIcon", component: AngleDownIcon },
  { name: "AngleUpIcon", component: AngleUpIcon },
  { name: "ArrowLeftIcon", component: ArrowLeftIcon },
  { name: "ArrowRightIcon", component: ArrowRightIcon },
  { name: "CloseIcon", component: CloseIcon },
  { name: "ErrorIcon", component: ErrorIcon },
  { name: "InfoIcon", component: InfoIcon },
  { name: "SpinnerScaleIcon", component: SpinnerScaleIcon },
  { name: "SuccessIcon", component: SuccessIcon },
  { name: "UserIcon", component: UserIcon },
  { name: "WarningIcon", component: WarningIcon },
];

// ─── Placeholder component (Meta needs a component) ───────────────────────────

const IconGallery = () => null;

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: "Foundation/Icons",
  component: IconGallery,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "All SVG icon components available in `@origin/react`. " +
          "Each icon accepts standard `SVGProps` and uses `fill=\"currentColor\"` — " +
          "set a text colour on a parent element to tint them.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Grid ─────────────────────────────────────────────────────────────────────

export const AllIcons: Story = {
  name: "All icons",
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
        gap: "var(--space-gap-md, 16px)",
      }}
    >
      {icons.map(({ name, component: Icon }) => (
        <div
          key={name}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-gap-xs, 8px)",
            padding: "var(--space-gap-md, 16px)",
            borderRadius: "var(--radius-md, 6px)",
            border: "1px solid var(--color-border-default, #e2e8f0)",
          }}
        >
          <Icon width={24} height={24} className="text-text-default" />
          <span
            style={{
              fontSize: "11px",
              textAlign: "center",
              wordBreak: "break-all",
              color: "var(--color-text-subdued, #64748b)",
            }}
          >
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};

// ─── Sizes ────────────────────────────────────────────────────────────────────

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-gap-lg, 24px)", flexWrap: "wrap" }}>
      {([16, 20, 24, 32] as const).map((size) => (
        <div
          key={size}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-gap-xs, 8px)" }}
        >
          <ArrowRightIcon width={size} height={size} className="text-text-default" />
          <span style={{ fontSize: "11px", color: "var(--color-text-subdued, #64748b)" }}>{size}px</span>
        </div>
      ))}
    </div>
  ),
};

// ─── Colours ──────────────────────────────────────────────────────────────────

export const Colours: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "var(--space-gap-md, 16px)", flexWrap: "wrap" }}>
      {(
        [
          { label: "Default", className: "text-text-default" },
          { label: "Subdued", className: "text-text-subdued" },
          { label: "Primary", className: "text-interaction-primary-text-default" },
          { label: "Error", className: "text-utility-error-text" },
          { label: "Success", className: "text-utility-success-text" },
        ] as const
      ).map(({ label, className }) => (
        <div
          key={label}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-gap-xs, 8px)" }}
        >
          <span className={className}>
            <UserIcon width={24} height={24} />
          </span>
          <span style={{ fontSize: "11px", color: "var(--color-text-subdued, #64748b)" }}>{label}</span>
        </div>
      ))}
    </div>
  ),
};
