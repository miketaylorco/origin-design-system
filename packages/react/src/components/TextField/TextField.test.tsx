import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { TextField } from "./TextField.js";

expect.extend(toHaveNoViolations);

describe("TextField", () => {
  it("renders the label and associates it with the input", () => {
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toBeInTheDocument();
  });

  it("renders helper text", () => {
    render(<TextField label="Email" helperText="We'll never share your email." />);
    expect(screen.getByText("We'll never share your email.")).toBeInTheDocument();
  });

  it("renders error message and sets aria-invalid", () => {
    render(<TextField label="Email" errorMessage="Invalid email." />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Invalid email.")).toBeInTheDocument();
  });

  it("shows both helper text and error message when both are provided", () => {
    render(
      <TextField label="Email" helperText="Hint" errorMessage="Required." />
    );
    expect(screen.getByText("Required.")).toBeInTheDocument();
    expect(screen.getByText("Hint")).toBeInTheDocument();
  });

  it("associates helper text with the input via aria-describedby", () => {
    render(<TextField label="Email" helperText="Hint text." />);
    const input = screen.getByRole("textbox", { name: "Email" });
    const descId = input.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();
    expect(document.getElementById(descId!)).toHaveTextContent("Hint text.");
  });

  it("references both helper and error IDs in aria-describedby when both are provided", () => {
    render(
      <TextField label="Email" helperText="Hint." errorMessage="Required." />
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    const ids = describedBy.split(" ");
    expect(ids).toHaveLength(2);
    expect(document.getElementById(ids[0]!)).toHaveTextContent("Hint.");
    expect(document.getElementById(ids[1]!)).toHaveTextContent("Required.");
  });

  it("has no aria-describedby when no support text is provided", () => {
    render(<TextField label="Email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("is disabled when disabled prop is set", () => {
    render(<TextField label="Email" disabled />);
    expect(screen.getByRole("textbox", { name: "Email" })).toBeDisabled();
  });

  it("is read-only when readOnly prop is set", () => {
    render(<TextField label="Email" readOnly value="test" onChange={vi.fn()} />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "readonly"
    );
  });

  it("calls onChange when the user types", async () => {
    const handleChange = vi.fn();
    render(<TextField label="Email" onChange={handleChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a");
    expect(handleChange).toHaveBeenCalled();
  });

  it("does not call onChange when disabled", async () => {
    const handleChange = vi.fn();
    render(<TextField label="Email" disabled onChange={handleChange} />);
    await userEvent.type(screen.getByRole("textbox", { name: "Email" }), "a");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("forwards ref to the input element", () => {
    const ref = createRef<HTMLInputElement>();
    render(<TextField label="Email" ref={ref} />);
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("uses a provided id", () => {
    render(<TextField label="Email" id="my-email" />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "id",
      "my-email"
    );
  });

  // ─── Accessibility ──────────────────────────────────────────────────────────

  it("has no axe violations (default)", async () => {
    const { container } = render(<TextField label="Email" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (error state)", async () => {
    const { container } = render(
      <TextField label="Email" errorMessage="Required." />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (disabled)", async () => {
    const { container } = render(<TextField label="Email" disabled />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (with helper text)", async () => {
    const { container } = render(
      <TextField label="Email" helperText="Hint text." />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations (error with helper text)", async () => {
    const { container } = render(
      <TextField label="Email" helperText="Hint text." errorMessage="Required." />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
