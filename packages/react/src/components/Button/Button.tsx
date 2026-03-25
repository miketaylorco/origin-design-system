import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.js";

// ─── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles — shared across all variants
  [
    "inline-flex items-center justify-center gap-[var(--space-gap-xs)]",
    "font-medium leading-none whitespace-nowrap select-none",
    "border transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "focus-visible:ring-[var(--interaction-primary-background-default)]",
    "disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--interaction-primary-background-default)]",
          "text-[var(--interaction-primary-text-default)]",
          "border-[var(--interaction-primary-border-default)]",
          "hover:bg-[var(--interaction-primary-background-hover)]",
          "hover:border-[var(--interaction-primary-border-hover)]",
          "active:bg-[var(--interaction-primary-background-active)]",
          "active:border-[var(--interaction-primary-border-active)]",
          "disabled:bg-[var(--interaction-primary-background-disabled)]",
          "disabled:text-[var(--interaction-primary-text-disabled)]",
          "disabled:border-[var(--interaction-primary-border-disabled)]",
        ],
        secondary: [
          "bg-[var(--interaction-secondary-background-default)]",
          "text-[var(--interaction-secondary-text-default)]",
          "border-[var(--interaction-secondary-border-default)]",
          "hover:bg-[var(--interaction-secondary-background-hover)]",
          "hover:border-[var(--interaction-secondary-border-hover)]",
          "active:bg-[var(--interaction-secondary-background-active)]",
          "active:border-[var(--interaction-secondary-border-active)]",
          "disabled:bg-[var(--interaction-secondary-background-disabled)]",
          "disabled:text-[var(--interaction-secondary-text-disabled)]",
          "disabled:border-[var(--interaction-secondary-border-disabled)]",
        ],
        ghost: [
          "bg-transparent",
          "text-[var(--interaction-ghost-text-default)]",
          "border-transparent",
          "hover:bg-[var(--interaction-ghost-background-hover)]",
          "active:bg-[var(--interaction-ghost-background-active)]",
          "disabled:text-[var(--interaction-ghost-text-disabled)]",
        ],
      },
      size: {
        sm: [
          "h-8 px-[var(--space-inset-sm)] text-[var(--font-size-body-sm)]",
          "rounded-[var(--radius-sm)]",
        ],
        md: [
          "h-10 px-[var(--space-inset-md)] text-[var(--font-size-body-md)]",
          "rounded-[var(--radius-sm)]",
        ],
        lg: [
          "h-12 px-[var(--space-inset-lg)] text-[var(--font-size-body-lg)]",
          "rounded-[var(--radius-md)]",
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
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <svg
            aria-hidden="true"
            className="animate-spin"
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
      </button>
    );
  }
);

Button.displayName = "Button";
