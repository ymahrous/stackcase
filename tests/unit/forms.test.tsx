import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TextAreaField, TextField } from "@/components/forms/Field";
import { FormMessage } from "@/components/forms/FormMessage";
import { UsernameField } from "@/components/forms/UsernameField";
import { ClaimForm } from "@/components/marketing/ClaimForm";

function mockFetch(body: unknown, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("TextField and TextAreaField", () => {
  it("wire the label, hint and error to the control", () => {
    render(<TextField name="email" label="Email" hint="We never share it." error="Enter a valid email." />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("We never share it. Enter a valid email.");
  });
  it("omit aria attributes when there is nothing to describe", () => {
    render(<TextAreaField name="bio" label="Intro" />);
    const textarea = screen.getByLabelText("Intro");
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).not.toHaveAttribute("aria-invalid");
    expect(textarea).not.toHaveAttribute("aria-describedby");
  });
});

describe("FormMessage", () => {
  it("announces errors as alerts and success as status", () => {
    const { rerender } = render(<FormMessage state={{ status: "error", message: "Nope" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Nope");
    rerender(<FormMessage state={{ status: "success", message: "Saved" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    rerender(<FormMessage state={{ status: "idle" }} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

describe("UsernameField", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("flags format problems instantly without a request", () => {
    const fetch = mockFetch({});
    render(<UsernameField prefix="stackcase.test/" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "ab" } });
    expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("lowercases input and turns spaces into hyphens", () => {
    mockFetch({ available: true, message: "Available" });
    render(<UsernameField prefix="stackcase.test/" />);
    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "Jane Doe" } });
    expect(input).toHaveValue("jane-doe");
  });

  it("checks availability after a pause and offers suggestions", async () => {
    const fetch = mockFetch({
      available: false,
      message: "That username is taken.",
      suggestions: ["alice-dev"],
    });
    render(<UsernameField prefix="stackcase.test/" />);
    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "alice" } });
    expect(screen.getByText("Checking…")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(fetch).toHaveBeenCalledWith("/api/username?u=alice", expect.anything());
    expect(screen.getByText(/that username is taken/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "alice-dev" }));
    expect(input).toHaveValue("alice-dev");
  });

  it("reports the current username as available without a request", () => {
    const fetch = mockFetch({});
    render(<UsernameField prefix="stackcase.test/" current="alice" defaultValue="alice" />);
    expect(screen.getByText(/this is your current username/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the server error until the value changes", () => {
    mockFetch({ available: true, message: "Available" });
    render(
      <UsernameField prefix="stackcase.test/" defaultValue="bob" error="That username was just taken." />,
    );
    expect(screen.getByText("That username was just taken.")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "bobby" } });
    expect(screen.queryByText("That username was just taken.")).toBeNull();
  });

  it("explains rate limiting and network errors", async () => {
    mockFetch({ error: "x" }, 429);
    render(<UsernameField prefix="stackcase.test/" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "carol" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(screen.getByText(/checking too fast/i)).toBeInTheDocument();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline"))),
    );
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "carol2" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(screen.getByText(/couldn't check/i)).toBeInTheDocument();
  });
});

describe("ClaimForm", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("is a plain GET form to /signup so it works without JavaScript", () => {
    const { container } = render(<ClaimForm prefix="stackcase.test/" />);
    const formEl = container.querySelector("form")!;
    expect(formEl).toHaveAttribute("action", "/signup");
    expect(formEl).toHaveAttribute("method", "get");
    expect(screen.getByLabelText("Username")).toHaveAttribute("name", "username");
    expect(screen.getByText(/no credit card/i)).toBeInTheDocument();
  });

  it("confirms availability with the full address", async () => {
    mockFetch({ available: true, message: "Available" });
    render(<ClaimForm prefix="stackcase.test/" cta="Claim my URL" />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "dana" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(screen.getByText("✓ stackcase.test/dana is available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim my URL" })).toBeInTheDocument();
  });

  it("offers alternatives for taken names", async () => {
    mockFetch({ available: false, message: "That username is taken.", suggestions: ["dana-dev", "dana-2"] });
    render(<ClaimForm prefix="stackcase.test/" />);
    const input = screen.getByLabelText("Username");
    fireEvent.change(input, { target: { value: "dana" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    fireEvent.click(screen.getByRole("button", { name: "dana-2" }));
    expect(input).toHaveValue("dana-2");
  });
});
