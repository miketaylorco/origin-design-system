import { forwardRef } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.js";
import { SuccessIcon } from "../icons/SuccessIcon.js";
import { WarningIcon } from "../icons/WarningIcon.js";
import { ErrorIcon } from "../icons/ErrorIcon.js";
import { InfoIcon } from "../icons/InfoIcon.js";
import { CloseIcon } from "../icons/CloseIcon.js";

// ─── Variants ─────────────────────────────────────────────────────────────────

const alertVariants = cva(
  [
    "flex items-start gap-[var(--alert-spacing-gap)]",
    "px-[var(--alert-spacing-padding-x)] py-[var(--alert-spacing-padding-y)]",
    "rounded-[var(--alert-radius)]",
    "border",
    "[font-size:var(--alert-font-size-message)] [line-height:var(--alert-line-height-message)]",
  ],
  {
    variants: {
      variant: {
        success:
          "bg-alert-success-background text-alert-success-text border-alert-success-border",
        warning:
          "bg-alert-warning-background text-alert-warning-text border-alert-warning-border",
        error:
          "bg-alert-error-background text-alert-error-text border-alert-error-border",
        info: "bg-alert-info-background text-alert-info-text border-alert-info-border",
      },
    },
    defaultVariants: { variant: "info" },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertVariant = "success" | "warning" | "error" | "info";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Visual variant — controls colour scheme and leading icon. */
  variant?: AlertVariant;
  /**
   * Optional title rendered above the message in bold.
   */
  title?: string;
  /**
   * Alert message. Supports HTML content for bold text and inline links.
   * Use `message` for HTML strings; use `children` for React node content.
   * When both are provided, `children` takes precedence.
   */
  message?: string;
  /**
   * Callback fired when the dismiss button is clicked.
   * When provided, a close button is rendered on the right.
   */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
}

const variantIcons: Record<AlertVariant, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  success: SuccessIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      message,
      children,
      onDismiss,
      dismissLabel = "Dismiss",
      role = "alert",
      ...props
    },
    ref
  ) => {
    const Icon = variantIcons[variant];

    return (
      <div
        ref={ref}
        role={role}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {/* Leading icon */}
        <Icon
          className="shrink-0"
          style={{ width: "var(--alert-icon-size)", height: "var(--alert-icon-size)" }}
          aria-hidden="true"
        />

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {title && (
            <p
              className="font-semibold mb-0.5 [font-size:var(--alert-font-size-title)] [line-height:var(--alert-line-height-title)]"
            >
              {title}
            </p>
          )}
          {children ?? (
            message ? (
              <div dangerouslySetInnerHTML={{ __html: message }} />
            ) : null
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            aria-label={dismissLabel}
            onClick={onDismiss}
            className={cn(
              "shrink-0 -mt-0.5 -mr-1 self-start rounded-[var(--alert-focus-ring-radius)]",
              "opacity-70 hover:opacity-100 transition-opacity duration-150 motion-reduce:transition-none",
              "focus-visible:outline focus-visible:outline-border-focus",
              "focus-visible:[outline-width:var(--alert-focus-ring-width)]",
              "focus-visible:[outline-offset:calc(var(--alert-focus-ring-offset)*1px)]",
            )}
          >
            <CloseIcon
              style={{ width: "var(--alert-icon-size)", height: "var(--alert-icon-size)" }}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = "Alert";
