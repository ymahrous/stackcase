import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* Captures the props the Vercel components receive, so their URL filters can be exercised directly. */
type Filter = (e: { url: string; type?: string }) => { url: string } | null;
const received: Partial<Record<"analytics" | "speed", Filter>> = {};
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
const { SiteFooter } = await import("@/components/SiteFooter");
const { AnalyticsConsentToggle } = await import("@/components/telemetry/AnalyticsConsentToggle");
const { CONSENT_COOKIE, consentCookie, effectiveConsent, readConsent } = await import("@/lib/consent");
const { afterResponse } = await import("@/lib/after-response");
const Icons = await import("@/components/Icons");

describe("analytics consent helpers", () => {
  it("reads only a valid stored choice", () => {
    expect(readConsent(`theme=dark; ${CONSENT_COOKIE}=granted`)).toBe("granted");
    expect(readConsent(`${CONSENT_COOKIE}=denied`)).toBe("denied");
    expect(readConsent(`${CONSENT_COOKIE}=maybe; other=1`)).toBeNull();
    expect(readConsent("")).toBeNull();
  });
  it("stores the choice for 180 days, Secure on https", () => {
    expect(consentCookie("granted", true)).toBe(
      `${CONSENT_COOKIE}=granted; Path=/; Max-Age=15552000; SameSite=Lax; Secure`,
    );
    expect(consentCookie("denied", false)).not.toContain("Secure");
  });
  it("lets an explicit choice win over Global Privacy Control, which otherwise means no", () => {
    expect(effectiveConsent("granted", true)).toBe("granted");
    expect(effectiveConsent(null, true)).toBe("denied");
    expect(effectiveConsent(null, false)).toBeNull();
  });
});

describe("Telemetry", () => {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  beforeEach(() => {
    document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`;
    delete received.analytics;
    delete received.speed;
  });
  afterEach(() => {
    delete nav.globalPrivacyControl;
    vi.unstubAllEnvs();
  });

  it("asks first, and loads nothing until the visitor allows analytics", async () => {
    render(<Telemetry />);
    expect(screen.getByRole("region", { name: "Cookie settings" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Details" })).toHaveAttribute("href", "/privacy#cookies");
    expect(received.analytics).toBeUndefined();
    expect(received.speed).toBeUndefined();

    await userEvent.click(screen.getByRole("button", { name: "Allow analytics" }));
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=granted`);
    expect(screen.queryByRole("region", { name: "Cookie settings" })).toBeNull();
    for (const filter of [received.analytics!, received.speed!]) {
      expect(filter({ url: "https://s.test/alice?utm_source=x&email=a%40b.co#top" })).toEqual({
        url: "https://s.test/alice?utm_source=x",
      });
      expect(filter({ url: "https://s.test/reset-password?token=secret" })).toBeNull();
    }
  });

  it("stays off after Decline, and withdrawing consent stops sending at once", async () => {
    document.cookie = consentCookie("granted", false);
    vi.stubEnv("VERCEL", "1");
    render(
      <>
        <SiteFooter />
        <Telemetry />
      </>,
    );
    const filter = received.analytics!;
    expect(screen.queryByRole("region", { name: "Cookie settings" })).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Cookie settings" }));
    const panel = screen.getByRole("region", { name: "Cookie settings" });
    expect(panel).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "Decline" }));
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=denied`);
    expect(screen.queryByRole("region", { name: "Cookie settings" })).toBeNull();
    // A script that already loaded can't send anything more.
    expect(filter({ url: "https://s.test/alice" })).toBeNull();
  });

  it("renders nothing on the server, so the HTML never depends on the visitor", () => {
    expect(renderToString(<Telemetry />)).toBe("");
    expect(received.analytics).toBeUndefined();
  });

  it("the Settings switch turns analytics on and off, in step with the banner", async () => {
    render(
      <>
        <AnalyticsConsentToggle />
        <Telemetry />
      </>,
    );
    const toggle = screen.getByRole("checkbox", { name: /Allow anonymous analytics/ });
    expect(toggle).not.toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Analytics are off in this browser.");

    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=granted`);
    expect(screen.queryByRole("region", { name: "Cookie settings" })).toBeNull();
    const filter = received.analytics!;
    expect(filter({ url: "https://s.test/alice" })).toEqual({ url: "https://s.test/alice" });

    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(document.cookie).toContain(`${CONSENT_COOKIE}=denied`);
    expect(screen.getByRole("status")).toHaveTextContent("Analytics are off in this browser.");
    expect(filter({ url: "https://s.test/alice" })).toBeNull();
  });

  it("treats Global Privacy Control as a refusal and doesn't ask", () => {
    nav.globalPrivacyControl = true;
    render(<Telemetry />);
    expect(screen.queryByRole("region", { name: "Cookie settings" })).toBeNull();
    expect(received.analytics).toBeUndefined();
  });

  it("offers Cookie settings in the footer only where analytics run", () => {
    vi.stubEnv("VERCEL", "");
    const { unmount } = render(<SiteFooter />);
    expect(screen.queryByRole("button", { name: "Cookie settings" })).toBeNull();
    unmount();
    vi.stubEnv("VERCEL", "1");
    act(() => {
      render(<SiteFooter />);
    });
    expect(screen.getByRole("button", { name: "Cookie settings" })).toBeVisible();
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
