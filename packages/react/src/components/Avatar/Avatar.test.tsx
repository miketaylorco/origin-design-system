import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Avatar } from "./Avatar.js";

expect.extend(toHaveNoViolations);

describe("Avatar", () => {
  // ─── Accessibility ──────────────────────────────────────────────────────────

  it("image: has no axe violations", async () => {
    const { container } = render(
      <Avatar display="image" src="https://i.pravatar.cc/150" alt="Jane Smith" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("icon: has no axe violations", async () => {
    const { container } = render(
      <Avatar display="icon" aria-label="User profile" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("initials: has no axe violations", async () => {
    const { container } = render(
      <Avatar display="initials" initials="JS" aria-label="Jane Smith" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("interactive: has no axe violations", async () => {
    const { container } = render(
      <Avatar
        display="initials"
        initials="JS"
        aria-label="Jane Smith"
        onClick={vi.fn()}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  // ─── Image display ─────────────────────────────────────────────────────────

  it("renders an img with the correct src and alt", () => {
    render(
      <Avatar display="image" src="/avatar.jpg" alt="Test User" />
    );
    const img = screen.getByRole("img", { name: "Test User" });
    expect(img).toHaveAttribute("src", "/avatar.jpg");
  });

  // ─── Initials display ──────────────────────────────────────────────────────

  it("uppercases and truncates initials to 2 characters", () => {
    render(<Avatar display="initials" initials="abc" aria-label="abc" />);
    // The visible span is aria-hidden; the sr-only span has the full value
    expect(screen.getByText("AB")).toBeInTheDocument();
  });

  it("renders sr-only text for initials", () => {
    render(<Avatar display="initials" initials="JS" aria-label="Jane Smith" />);
    const srOnly = screen.getAllByText("JS");
    expect(srOnly.length).toBeGreaterThan(0);
  });

  // ─── Interactive behaviour ─────────────────────────────────────────────────

  it("is not interactive without onClick", () => {
    const { container } = render(<Avatar display="icon" aria-label="User" />);
    const el = container.firstChild as HTMLElement;
    expect(el).not.toHaveAttribute("role", "button");
    expect(el).not.toHaveAttribute("tabindex");
  });

  it("becomes a button when onClick is provided", () => {
    render(
      <Avatar display="icon" aria-label="Profile" onClick={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Profile" })).toBeInTheDocument();
  });

  it("calls onClick on click", async () => {
    const handler = vi.fn();
    render(
      <Avatar display="icon" aria-label="Profile" onClick={handler} />
    );
    await userEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Enter key", async () => {
    const handler = vi.fn();
    render(
      <Avatar display="icon" aria-label="Profile" onClick={handler} />
    );
    screen.getByRole("button").focus();
    await userEvent.keyboard("{Enter}");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Space key", async () => {
    const handler = vi.fn();
    render(
      <Avatar display="icon" aria-label="Profile" onClick={handler} />
    );
    screen.getByRole("button").focus();
    await userEvent.keyboard(" ");
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // ─── Ref forwarding ────────────────────────────────────────────────────────

  it("forwards ref to the root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Avatar display="icon" ref={ref} aria-label="User" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  // ─── Size classes ──────────────────────────────────────────────────────────

  it.each(["sm", "md", "lg"] as const)("applies %s size class", (size) => {
    const { container } = render(
      <Avatar display="icon" size={size} aria-label="User" />
    );
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain(`var(--avatar-size-${size})`);
  });

  // ─── Colour classes ────────────────────────────────────────────────────────

  it.each(["neutral", "lilac", "rose", "sunset", "honey", "lime",
           "emerald", "aqua", "cerulean", "blue", "purple"] as const)(
    "applies %s colour class",
    (color) => {
      const { container } = render(
        <Avatar display="initials" initials="AB" color={color} aria-label="AB" />
      );
      const root = container.firstChild as HTMLElement;
      expect(root.className).toContain(`avatar-${color}-background`);
    }
  );
});
