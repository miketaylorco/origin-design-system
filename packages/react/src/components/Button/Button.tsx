import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.js";

// ─── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles — shared across all variants
  [
    "inline-flex items-center justify-center gap-[var(--button-spacing-gap)]",
    "font-medium leading-none whitespace-nowrap select-none",
    "border transition-colors duration-150 motion-reduce:transition-none",
    // Focus ring — outline-style/width/offset use T3 component tokens (not in preset)
    "focus-visible:outline focus-visible:outline-border-focus",
    "focus-visible:[outline-width:var(--button-focus-ring-width)]",
    "focus-visible:[outline-offset:calc(var(--button-focus-ring-offset)*1px)]",
    "disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-interaction-primary-background-default",
          "text-interaction-primary-text-default",
          "border-interaction-primary-border-default",
          "hover:bg-interaction-primary-background-hover",
          "hover:border-interaction-primary-border-hover",
          "active:bg-interaction-primary-background-active",
          "active:border-interaction-primary-border-active",
          "disabled:bg-interaction-primary-background-disabled",
          "disabled:text-interaction-primary-text-disabled",
          "disabled:border-interaction-primary-border-disabled",
        ],
        secondary: [
          "bg-interaction-secondary-background-default",
          "text-interaction-secondary-text-default",
          "border-interaction-secondary-border-default",
          "hover:bg-interaction-secondary-background-hover",
          "hover:border-interaction-secondary-border-hover",
          "active:bg-interaction-secondary-background-active",
          "active:border-interaction-secondary-border-active",
          "disabled:bg-interaction-secondary-background-disabled",
          "disabled:text-interaction-secondary-text-disabled",
          "disabled:border-interaction-secondary-border-disabled",
        ],
        ghost: [
          "bg-transparent",
          "text-interaction-ghost-text-default",
          "border-transparent",
          "hover:bg-interaction-ghost-background-hover",
          "active:bg-interaction-ghost-background-active",
          "disabled:text-interaction-ghost-text-disabled",
        ],
      },
      size: {
        sm: [
          "px-[var(--button-spacing-padding-x-sm)] py-[var(--button-spacing-padding-y-sm)] [font-size:var(--button-font-size-sm)]",
          "rounded-[var(--button-radius-sm)]",
        ],
        md: [
          "px-[var(--button-spacing-padding-x-md)] py-[var(--button-spacing-padding-y-md)] [font-size:var(--button-font-size-md)]",
          "rounded-[var(--button-radius-sm)]",
        ],
        lg: [
          "px-[var(--button-spacing-padding-x-lg)] py-[var(--button-spacing-padding-y-lg)] [font-size:var(--button-font-size-lg)]",
          "rounded-[var(--button-radius-lg)]",
        ],
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render a loading spinner and disable interaction */
  loading?: boolean;
  /** Icon rendered before the label. Sized to 1em × 1em; use an SVG with fill="currentColor". */
  iconLeft?: React.ReactNode;
  /** Icon rendered after the label. Sized to 1em × 1em; use an SVG with fill="currentColor". */
  iconRight?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, iconLeft, iconRight, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {iconLeft && (
          <span aria-hidden="true" className="shrink-0 inline-flex w-[1em] h-[1em] [&>svg]:w-full [&>svg]:h-full">
            {iconLeft}
          </span>
        )}
        {loading && (
          <svg
            aria-hidden="true"
            className="animate-spin motion-reduce:animate-none"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        )}
        {children}
        {iconRight && (
          <span aria-hidden="true" className="shrink-0 inline-flex w-[1em] h-[1em] [&>svg]:w-full [&>svg]:h-full">
            {iconRight}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
