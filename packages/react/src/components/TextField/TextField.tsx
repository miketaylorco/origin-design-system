import { forwardRef, useId } from "react";
import { cn } from "../../lib/cn.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TextFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  /** Label text — always required for accessibility */
  label: string;
  /** Optional hint displayed below the input */
  helperText?: string;
  /** Validation error message — also sets aria-invalid on the input */
  errorMessage?: string;
  /** Explicit id; auto-generated via useId() when omitted */
  id?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      label,
      helperText,
      errorMessage,
      id: idProp,
      disabled,
      readOnly,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const helperId = `${id}-helper`;
    const errorId  = `${id}-error`;
    const hasError = Boolean(errorMessage);

    // aria-describedby references whichever support elements are rendered,
    // space-separated so screen readers announce both when both are present.
    const describedBy =
      [helperText && helperId, errorMessage && errorId]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className="flex flex-col gap-[var(--text-field-spacing-gap)]">
        {/* Label */}
        <label
          htmlFor={id}
          className={cn(
            "block font-medium",
            "[font-size:var(--text-field-font-size-label)]",
            "[line-height:var(--text-field-line-height-label)]",
            disabled ? "text-text-subtle" : "text-text-subdued"
          )}
        >
          {label}
        </label>

        {/* Input */}
        <input
          ref={ref}
          id={id}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={hasError || undefined}
          aria-describedby={describedBy}
          className={cn(
            // Layout & geometry
            "block w-full border transition-colors duration-150 motion-reduce:transition-none",
            "px-[var(--text-field-spacing-padding-x)] py-[var(--text-field-spacing-padding-y)]",
            "rounded-[var(--text-field-radius)]",
            // Typography — T3 component tokens
            "[font-size:var(--text-field-font-size-input)]",
            "[line-height:var(--text-field-line-height-input)]",
            // Colours — T2 semantic tokens
            "bg-background-raised text-text-default",
            "placeholder:text-text-subtle",
            // Focus ring — T3 component tokens for geometry, T2 for colour
            "focus-visible:outline focus-visible:outline-border-focus",
            "focus-visible:[outline-width:var(--text-field-focus-ring-width)]",
            "focus-visible:[outline-offset:calc(var(--text-field-focus-ring-offset)*1px)]",
            // Border states
            hasError
              ? "border-utility-error-border"
              : "border-border-default hover:border-border-strong",
            // Disabled
            disabled && [
              "bg-background-subdued text-text-subtle",
              "border-border-subtle cursor-not-allowed",
            ],
            // Read-only
            !disabled && readOnly && [
              "bg-background-subdued border-border-subtle cursor-default",
            ],
            className
          )}
          {...props}
        />

        {/* Helper text — always rendered when provided, including during error state */}
        {helperText && (
          <p
            id={helperId}
            className={cn(
              "[font-size:var(--text-field-font-size-helper)]",
              "[line-height:var(--text-field-line-height-helper)]",
              "text-text-subtle"
            )}
          >
            {helperText}
          </p>
        )}

        {/* Error message — rendered alongside helper text when both are provided */}
        {errorMessage && (
          <p
            id={errorId}
            aria-live="polite"
            className={cn(
              "[font-size:var(--text-field-font-size-helper)]",
              "[line-height:var(--text-field-line-height-helper)]",
              "text-utility-error-text"
            )}
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

TextField.displayName = "TextField";
