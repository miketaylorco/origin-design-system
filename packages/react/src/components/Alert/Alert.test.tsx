import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { Alert } from "./Alert.js";

expect.extend(toHaveNoViolations);

describe("Alert", () => {
  // ─── Rendering ────────────────────────────────────────────────────────────

  it("renders with role='alert' by default", () => {
    render(<Alert message="Something happened." />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders the message text", () => {
    render(<Alert message="Saved successfully." />);
    expect(screen.getByText("Saved successfully.")).toBeInTheDocument();
  });

  it("renders the title when provided", () => {
    render(<Alert title="Heads up" message="Please review." />);
    expect(screen.getByText("Heads up")).toBeInTheDocument();
  });

  it("does not render a title element when title is omitted", () => {
    render(<Alert message="No title here." />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("renders children over the message prop", () => {
    render(<Alert message="Should not show">Children win</Alert>);
    expect(screen.getByText("Children win")).toBeInTheDocument();
    expect(screen.queryByText("Should not show")).not.toBeInTheDocument();
  });

  it("renders HTML message content via dangerouslySetInnerHTML", () => {
    render(<Alert message="Hello <strong>world</strong>" />);
    const strong = document.querySelector("strong");
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe("world");
  });

  // ─── Dismiss button ───────────────────────────────────────────────────────

  it("does not render a dismiss button when onDismiss is omitted", () => {
    render(<Alert message="No dismiss." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a dismiss button when onDismiss is provided", () => {
    render(<Alert message="Dismissible." onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("uses the dismissLabel prop as the button accessible name", () => {
    render(<Alert message="Close me." onDismiss={vi.fn()} dismissLabel="Close alert" />);
    expect(screen.getByRole("button", { name: "Close alert" })).toBeInTheDocument();
  });

  it("calls onDismiss when the dismiss button is clicked", async () => {
    const handleDismiss = vi.fn();
    render(<Alert message="Click to dismiss." onDismiss={handleDismiss} />);
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it("dismiss button has type='button'", () => {
    render(<Alert message="Check type." onDismiss={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Dismiss" })).toHaveAttribute("type", "button");
  });

  it("activates dismiss on Enter keypress", async () => {
    const handleDismiss = vi.fn();
    render(<Alert message="Keyboard dismiss." onDismiss={handleDismiss} />);
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  it("activates dismiss on Space keypress", async () => {
    const handleDismiss = vi.fn();
    render(<Alert message="Keyboard dismiss." onDismiss={handleDismiss} />);
    screen.getByRole("button", { name: "Dismiss" }).focus();
    await userEvent.keyboard(" ");
    expect(handleDismiss).toHaveBeenCalledOnce();
  });

  // ─── Ref forwarding ───────────────────────────────────────────────────────

  it("forwards ref to the root div", () => {
    const ref = createRef<HTMLDivElement>();
    render(<Alert ref={ref} message="Ref test." />);
    expect(ref.current?.tagName).toBe("DIV");
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  it("has no axe violations (info, default)", async () => {
    const { container } = render(<Alert variant="info" message="Info alert." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (success)", async () => {
    const { container } = render(<Alert variant="success" message="Success alert." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (warning)", async () => {
    const { container } = render(<Alert variant="warning" message="Warning alert." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (error)", async () => {
    const { container } = render(<Alert variant="error" message="Error alert." />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (with title)", async () => {
    const { container } = render(
      <Alert variant="warning" title="Watch out" message="Something needs attention." />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (with dismiss button)", async () => {
    const { container } = render(
      <Alert variant="success" message="Dismissed." onDismiss={vi.fn()} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
