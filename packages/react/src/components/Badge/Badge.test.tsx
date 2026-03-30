import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Badge } from "./Badge.js";

expect.extend(toHaveNoViolations);

describe("Badge", () => {
  // ─── Element type ──────────────────────────────────────────────────────────

  it("renders as a <span> when no onClick is provided", () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText("Label").tagName).toBe("SPAN");
  });

  it("renders as a <button> when onClick is provided", () => {
    render(<Badge onClick={vi.fn()}>Label</Badge>);
    expect(screen.getByRole("button", { name: "Label" })).toBeInTheDocument();
  });

  it("button has type='button' to prevent accidental form submission", () => {
    render(<Badge onClick={vi.fn()}>Label</Badge>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  // ─── Interaction ───────────────────────────────────────────────────────────

  it("calls onClick when the button badge is clicked", async () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Label</Badge>);
    await userEvent.click(screen.getByRole("button", { name: "Label" }));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when the badge is disabled", async () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick} disabled>Label</Badge>);
    await userEvent.click(screen.getByRole("button", { name: "Label" }));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Badge onClick={vi.fn()} disabled>Label</Badge>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("activates on Space keypress", async () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Label</Badge>);
    screen.getByRole("button").focus();
    await userEvent.keyboard(" ");
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("activates on Enter keypress", async () => {
    const handleClick = vi.fn();
    render(<Badge onClick={handleClick}>Label</Badge>);
    screen.getByRole("button").focus();
    await userEvent.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledOnce();
  });

  // ─── Ref forwarding ────────────────────────────────────────────────────────

  it("forwards ref to the span element (static)", () => {
    const ref = createRef<HTMLElement>();
    render(<Badge ref={ref}>Label</Badge>);
    expect(ref.current?.tagName).toBe("SPAN");
  });

  it("forwards ref to the button element (clickable)", () => {
    const ref = createRef<HTMLElement>();
    render(<Badge ref={ref} onClick={vi.fn()}>Label</Badge>);
    expect(ref.current?.tagName).toBe("BUTTON");
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────

  it("has no axe violations (static, neutral)", async () => {
    const { container } = render(<Badge>New</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (static, success)", async () => {
    const { container } = render(<Badge variant="success">Active</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (static, error)", async () => {
    const { container } = render(<Badge variant="error">Failed</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (static, warning)", async () => {
    const { container } = render(<Badge variant="warning">Pending</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (static, info)", async () => {
    const { container } = render(<Badge variant="info">Beta</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (static, brand)", async () => {
    const { container } = render(<Badge variant="brand">Pro</Badge>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (clickable)", async () => {
    const { container } = render(
      <Badge onClick={vi.fn()}>Filter</Badge>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (clickable, disabled)", async () => {
    const { container } = render(
      <Badge onClick={vi.fn()} disabled>Filter</Badge>
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (clickable, all variants)", async () => {
    const variants = ["neutral", "brand", "success", "error", "warning", "info"] as const;
    for (const variant of variants) {
      const { container } = render(
        <Badge variant={variant} onClick={vi.fn()}>{variant}</Badge>
      );
      expect(await axe(container)).toHaveNoViolations();
    }
  });
});
