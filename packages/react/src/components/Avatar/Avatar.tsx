import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn.js";
import { UserIcon } from "../icons/UserIcon.js";

// ─── Variants ─────────────────────────────────────────────────────────────────

const avatarBase = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-[var(--avatar-radius)] select-none",
  ],
  {
    variants: {
      size: {
        sm: "w-[var(--avatar-size-sm)] h-[var(--avatar-size-sm)]",
        md: "w-[var(--avatar-size-md)] h-[var(--avatar-size-md)]",
        lg: "w-[var(--avatar-size-lg)] h-[var(--avatar-size-lg)]",
      },
      color: {
        neutral: "bg-avatar-neutral-background text-avatar-neutral-foreground",
        lilac:   "bg-avatar-lilac-background   text-avatar-lilac-foreground",
        rose:    "bg-avatar-rose-background    text-avatar-rose-foreground",
        sunset:  "bg-avatar-sunset-background  text-avatar-sunset-foreground",
        honey:   "bg-avatar-honey-background   text-avatar-honey-foreground",
        lime:    "bg-avatar-lime-background    text-avatar-lime-foreground",
        emerald: "bg-avatar-emerald-background text-avatar-emerald-foreground",
        aqua:    "bg-avatar-aqua-background    text-avatar-aqua-foreground",
        cerulean:"bg-avatar-cerulean-background text-avatar-cerulean-foreground",
        blue:    "bg-avatar-blue-background    text-avatar-blue-foreground",
        purple:  "bg-avatar-purple-background  text-avatar-purple-foreground",
      },
    },
    defaultVariants: { size: "md", color: "neutral" },
  }
);

const iconSize: Record<"sm" | "md" | "lg", string> = {
  sm: "w-[var(--avatar-icon-size-sm)] h-[var(--avatar-icon-size-sm)]",
  md: "w-[var(--avatar-icon-size-md)] h-[var(--avatar-icon-size-md)]",
  lg: "w-[var(--avatar-icon-size-lg)] h-[var(--avatar-icon-size-lg)]",
};

const initialsSize: Record<"sm" | "md" | "lg", string> = {
  sm: "[font-size:var(--avatar-font-size-sm)]",
  md: "[font-size:var(--avatar-font-size-md)]",
  lg: "[font-size:var(--avatar-font-size-lg)]",
};

const hoverBg: Record<AvatarColor, string> = {
  neutral: "hover:bg-avatar-neutral-background-hover",
  lilac:   "hover:bg-avatar-lilac-background-hover",
  rose:    "hover:bg-avatar-rose-background-hover",
  sunset:  "hover:bg-avatar-sunset-background-hover",
  honey:   "hover:bg-avatar-honey-background-hover",
  lime:    "hover:bg-avatar-lime-background-hover",
  emerald: "hover:bg-avatar-emerald-background-hover",
  aqua:    "hover:bg-avatar-aqua-background-hover",
  cerulean:"hover:bg-avatar-cerulean-background-hover",
  blue:    "hover:bg-avatar-blue-background-hover",
  purple:  "hover:bg-avatar-purple-background-hover",
};

const focusRing = [
  "focus-visible:outline focus-visible:outline-border-focus",
  "focus-visible:[outline-width:var(--avatar-focus-ring-width)]",
  "focus-visible:[outline-offset:calc(var(--avatar-focus-ring-offset)*1px)]",
].join(" ");

// ─── Types ────────────────────────────────────────────────────────────────────

export type AvatarSize = "sm" | "md" | "lg";
export type AvatarColor =
  | "neutral" | "lilac" | "rose" | "sunset" | "honey" | "lime"
  | "emerald" | "aqua" | "cerulean" | "blue" | "purple";

type BaseProps = VariantProps<typeof avatarBase> & {
  size?: AvatarSize;
  color?: AvatarColor;
};

/** Image display — shows a photo; `src` and `alt` are required. */
export interface AvatarImageProps
  extends BaseProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  display: "image";
  src: string;
  alt: string;
  initials?: never;
}

/** Icon display — shows the user icon in the chosen colour. */
export interface AvatarIconProps
  extends BaseProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  display: "icon";
  /** Required: icon content is aria-hidden, so the container needs an explicit label. */
  "aria-label": string;
  src?: never;
  alt?: never;
  initials?: never;
}

/** Initials display — shows up to 2 characters in the chosen colour. */
export interface AvatarInitialsProps
  extends BaseProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  display: "initials";
  initials: string;
  /** Required: role="img" cannot be named from content per ARIA spec. */
  "aria-label": string;
  src?: never;
  alt?: never;
}

export type AvatarProps = AvatarImageProps | AvatarIconProps | AvatarInitialsProps;

// ─── Component ────────────────────────────────────────────────────────────────

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (props, ref) => {
    const {
      display,
      size = "md",
      color = "neutral",
      className,
      onClick,
      ...rest
    } = props;

    const isInteractive = !!onClick;
    // Non-interactive icon/initials avatars need role="img" so aria-label is valid.
    // Image display gets its semantics from the inner <img> element.
    const implicitRole =
      !isInteractive && display !== "image" ? "img" : undefined;

    const classes = cn(
      avatarBase({ size, color }),
      isInteractive && hoverBg[color],
      isInteractive && display === "image" && "group",
      isInteractive && ["cursor-pointer", focusRing],
      className
    );

    const content = (() => {
      if (display === "image") {
        const { src, alt } = props as AvatarImageProps;
        return (
          <>
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              draggable={false}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-avatar-image-overlay-hover transition-opacity motion-reduce:transition-none"
            />
          </>
        );
      }

      if (display === "icon") {
        return (
          <UserIcon
            className={cn("shrink-0", iconSize[size])}
            aria-hidden="true"
          />
        );
      }

      // initials
      const { initials } = props as AvatarInitialsProps;
      return (
        <span
          aria-hidden="true"
          className={cn("font-medium leading-none", initialsSize[size])}
        >
          {initials.slice(0, 2).toUpperCase()}
        </span>
      );
    })();

    return (
      <div
        ref={ref}
        role={isInteractive ? "button" : implicitRole}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? onClick : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
                }
              }
            : undefined
        }
        className={classes}
        {...(rest as React.HTMLAttributes<HTMLDivElement>)}
      >
        {content}
        {display === "initials" && (
          <span className="sr-only">{(props as AvatarInitialsProps).initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";
