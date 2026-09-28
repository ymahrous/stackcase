import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/dashboard/projects" }));

const { DashTabs, dashTabs } = await import("@/components/dashboard/DashTabs");
const { CopyButton } = await import("@/components/dashboard/CopyButton");

describe("DashTabs", () => {
  it("marks the current page", () => {
    render(<DashTabs />);
    expect(screen.getAllByRole("link")).toHaveLength(dashTabs.length);
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });
});

describe("CopyButton", () => {
  afterEach(() => vi.useRealTimers());

  it("copies and confirms, then resets", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CopyButton text="https://stackcase.test/alice" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(writeText).toHaveBeenCalledWith("https://stackcase.test/alice");
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copy link");
  });

  it("stays usable when the clipboard is blocked", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn(async () => Promise.reject(new Error("denied"))) },
      configurable: true,
    });
    render(<CopyButton text="x" label="Copy" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(screen.getByRole("button")).toHaveTextContent("Copy");
  });
});
