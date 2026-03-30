import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.js";

// ─── Variants ─────────────────────────────────────────────────────────────────

/** Base styles shared by static and clickable badges */
const badgeBase = cva(
  [
    "inline-flex items-center justify-center",
    "px-[var(--badge-spacing-padding-x)] py-[var(--badge-spacing-padding-y)]",
    "rounded-[var(--badge-radius)]",
    "[font-size:var(--badge-font-size)] [line-height:var(--badge-line-height)]",
    "font-medium whitespace-nowrap select-none",
  ],
  {
    variants: {
      variant: {
        neutral: "bg-badge-neutral-background-default text-badge-neutral-text",
        brand: "bg-badge-brand-background-default text-badge-brand-text",
        success: "bg-badge-success-background-default text-badge-success-text",
        error: "bg-badge-error-background-default text-badge-error-text",
        warning: "bg-badge-warning-background-default text-badge-warning-text",
        info: "bg-badge-info-background-default text-badge-info-text",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

/** Additional styles applied only when the badge is a clickable <button> */
const badgeInteractive = cva(
  [
    "cursor-pointer border-0",
    "transition-colors duration-150 motion-reduce:transition-none",
    "focus-visible:outline focus-visible:outline-border-focus",
    "focus-visible:[outline-width:var(--badge-focus-ring-width)]",
    "focus-visible:[outline-offset:calc(var(--badge-focus-ring-offset)*1px)]",
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        neutral:
          "hover:bg-badge-neutral-background-hover active:bg-badge-neutral-background-active",
        brand:
          "hover:bg-badge-brand-background-hover active:bg-badge-brand-background-active",
        success:
          "hover:bg-badge-success-background-hover active:bg-badge-success-background-active",
        error:
          "hover:bg-badge-error-background-hover active:bg-badge-error-background-active",
        warning:
          "hover:bg-badge-warning-background-hover active:bg-badge-warning-background-active",
        info:
          "hover:bg-badge-info-background-hover active:bg-badge-info-background-active",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "success"
  | "error"
  | "warning"
  | "info";

export interface BadgeProps extends React.HTMLAttributes<HTMLElement> {
  /** Visual variant — maps to T2 semantic badge colour tokens. */
  variant?: BadgeVariant;
  /**
   * Click handler. When provided the badge renders as a focusable `<button>`
   * with hover, active, and focus-ring states. Omit for a decorative `<span>`.
   */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Only meaningful when `onClick` is supplied. */
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Badge = forwardRef<HTMLElement, BadgeProps>(
  (
    { className, variant = "neutral", onClick, disabled, children, ...props },
    ref
  ) => {
    const isClickable = !!onClick;
    const classes = cn(
      badgeBase({ variant }),
      isClickable && badgeInteractive({ variant }),
      className
    );

    if (isClickable) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          {children}
        </button>
      );
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={classes}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
