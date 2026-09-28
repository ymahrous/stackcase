import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

/* Captures the props the Vercel components receive, so their URL filters can be exercised directly. */
type Filter = (e: { url: string; type?: string }) => { url: string } | null;
const received: Record<string, Filter> = {};
vi.mock("@vercel/analytics/next", () => ({
  Analytics: ({ beforeSend }: { beforeSend: Filter }) => {
    received.analytics = beforeSend;
    return null;
  },
}));
vi.mock("@vercel/speed-insights/next", () => ({
  SpeedInsights: ({ beforeSend }: { beforeSend: Filter }) => {
    received.speed = beforeSend;
    return null;
  },
}));

const scheduled: (() => Promise<void>)[] = [];
vi.mock("next/server", () => ({ after: (fn: () => Promise<void>) => scheduled.push(fn) }));

const { Telemetry } = await import("@/components/telemetry/Telemetry");
const { afterResponse } = await import("@/lib/after-response");
const Icons = await import("@/components/Icons");

describe("Telemetry", () => {
  it("cleans every URL before analytics or Speed Insights sends it", () => {
    render(<Telemetry />);
    for (const filter of [received.analytics!, received.speed!]) {
      expect(filter({ url: "https://s.test/alice?utm_source=x&email=a%40b.co#top" })).toEqual({
        url: "https://s.test/alice?utm_source=x",
      });
      expect(filter({ url: "https://s.test/reset-password?token=secret" })).toBeNull();
    }
  });
});

describe("afterResponse", () => {
  afterEach(() => {
    scheduled.length = 0;
    vi.restoreAllMocks();
  });

  it("schedules the task after the response", async () => {
    const task = vi.fn(async () => "ok");
    afterResponse("demo", task);
    expect(task).not.toHaveBeenCalled();
    await scheduled[0]!();
    expect(task).toHaveBeenCalledOnce();
  });

  it("logs failures as structured errors instead of throwing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    afterResponse("send email", async () => {
      throw new Error("smtp down");
    });
    await expect(scheduled[0]!()).resolves.toBeUndefined();
    const entry = JSON.parse(error.mock.calls[0]![0] as string);
    expect(entry).toMatchObject({
      level: "error",
      event: "after_response.failed",
      task: "send email",
      error: { name: "Error", message: "smtp down" },
    });
  });
});

describe("Icons", () => {
  it("every icon is decorative and hidden from assistive technology", () => {
    for (const [name, Icon] of Object.entries(Icons)) {
      const { container, unmount } = render((Icon as (p: object) => ReactElement)({ className: "x" }));
      const svg = container.querySelector("svg")!;
      expect(svg, name).toHaveAttribute("aria-hidden", "true");
      expect(svg, name).toHaveAttribute("focusable", "false");
      expect(svg, name).toHaveClass("x");
      unmount();
    }
  });
});
