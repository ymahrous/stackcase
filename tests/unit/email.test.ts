import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { resolveFrom, resolveTransport } from "@/lib/email/config";
import { render } from "@react-email/render";
import { createElement } from "react";
import AccountDeleted from "@/emails/AccountDeleted";
import { formatWhen } from "@/emails/components/theme";
import PasswordChanged from "@/emails/PasswordChanged";
import PasswordReset from "@/emails/PasswordReset";
import UsernameChanged from "@/emails/UsernameChanged";
import VerifyEmail from "@/emails/VerifyEmail";
import {
  accountDeletedTemplate,
  passwordChangedTemplate,
  passwordResetTemplate,
  usernameChangedTemplate,
  verifyEmailTemplate,
} from "@/lib/email/templates";

describe("resolveTransport", () => {
  it("uses Resend whenever an API key is set", () => {
    expect(resolveTransport({ RESEND_API_KEY: "re_123", NODE_ENV: "production" })).toBe("resend");
    expect(
      resolveTransport({ RESEND_API_KEY: "re_123", EMAIL_TRANSPORT: "file", EMAIL_OUTBOX_DIR: "x" }),
    ).toBe("resend");
  });
  it("writes to a folder for end-to-end tests", () => {
    expect(
      resolveTransport({ EMAIL_TRANSPORT: "file", EMAIL_OUTBOX_DIR: "/tmp/outbox", NODE_ENV: "production" }),
    ).toBe("file");
    expect(resolveTransport({ EMAIL_TRANSPORT: "file", NODE_ENV: "production" })).toBe("disabled");
  });
  it("logs in development and refuses silently in production without a key", () => {
    expect(resolveTransport({ NODE_ENV: "development" })).toBe("console");
    expect(resolveTransport({ RESEND_API_KEY: "  ", NODE_ENV: "production" })).toBe("disabled");
  });
});

describe("resolveFrom", () => {
  it("prefers EMAIL_FROM and falls back to Resend's test sender", () => {
    expect(resolveFrom({ EMAIL_FROM: "Stackcase <hi@mail.example.com>" })).toBe(
      "Stackcase <hi@mail.example.com>",
    );
    expect(resolveFrom({})).toBe("Stackcase <onboarding@resend.dev>");
  });
});

describe("templates", () => {
  const url = "https://stackcase.test/reset-password?token=abc&x=1";

  it("escape user-supplied names in HTML but keep them readable in text", async () => {
    const email = await verifyEmailTemplate({ name: '<script>alert("x")</script>', url });
    expect(email.html).not.toContain("<script>alert");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain('Hi <script>alert("x")</script>,');
  });

  it("include the link as a button and in the plain-text version, with & escaped in HTML", async () => {
    const email = await passwordResetTemplate({ name: "Ada", url, minutes: 60 });
    expect(email.subject).toBe("Reset your Stackcase password");
    expect(email.html).toContain('href="https://stackcase.test/reset-password?token=abc&amp;x=1"');
    expect(email.text).toContain(url);
    expect(email.text).toContain("60 minutes");
    // The action link is the first link in the text version (the header is skipped), so it's easy to find.
    expect(/https?:\/\/\S+/.exec(email.text)![0]).toBe(url);
  });

  it("tell users what to do if a change wasn't them, with the time in UTC", async () => {
    const when = new Date("2026-09-28T07:05:00Z");
    const changed = await passwordChangedTemplate({ name: "Ada", when });
    expect(changed.text).toContain("https://stackcase.test/forgot-password");
    expect(changed.text).toContain("28 Sep 2026, 07:05 UTC");
    const renamed = await usernameChangedTemplate({
      name: "Ada",
      previous: "ada",
      username: "ada-dev",
      holdDays: 30,
      when,
    });
    expect(renamed.subject).toBe("Your portfolio link is now stackcase.test/ada-dev");
    expect(renamed.text).toContain("https://stackcase.test/ada-dev");
    expect(renamed.text).toContain("30 days from the old address");
    const deleted = await accountDeletedTemplate({ name: "Ada", username: "ada", when });
    expect(deleted.text).toContain("stackcase.test/ada");
  });

  it("render a complete document with preview text, headings in normal case and a Stackcase copyright", async () => {
    const { html, text } = await verifyEmailTemplate({ name: "Ada", url });
    expect(html).toMatch(/^<!DOCTYPE html/);
    expect(html).toContain('lang="en"');
    expect(html).toContain("One click to confirm your address.");
    expect(html).toContain("https://stackcase.test/email-logo.png");
    expect(html).toContain("prefers-color-scheme: dark");
    expect(text.startsWith("Confirm your email")).toBe(true);
    expect(text).not.toContain("One click to confirm");
    const year = new Date().getFullYear();
    for (const out of [html, text]) {
      expect(out).toContain(`© ${year} Stackcase. All rights reserved.`);
      expect(out).toContain("https://stackcase.test/privacy");
      expect(out).toContain("https://stackcase.test/terms");
    }
  });

  it("formatWhen is unambiguous and independent of the server's locale", () => {
    expect(formatWhen(new Date("2026-01-02T03:04:00Z"))).toBe("2 Jan 2026, 03:04 UTC");
  });

  it("every template previews with its sample props", async () => {
    const templates = [VerifyEmail, PasswordReset, PasswordChanged, UsernameChanged, AccountDeleted];
    for (const T of templates) {
      const html = await render(createElement(T as never, T.PreviewProps as never));
      expect(html, T.name).toContain("Stackcase");
    }
  });
});

describe("plain-text snapshots", () => {
  // Snapshots catch unintended wording or layout changes in every email. Update them on purpose with `vitest -u`.
  const when = new Date("2026-09-28T07:15:00Z");
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(when);
  });
  afterAll(() => vi.useRealTimers());

  it.each([
    [
      "verify",
      () => verifyEmailTemplate({ name: "Ada", url: "https://stackcase.test/verify-email?token=t" }),
    ],
    [
      "reset",
      () =>
        passwordResetTemplate({
          name: "Ada",
          url: "https://stackcase.test/reset-password?token=t",
          minutes: 60,
        }),
    ],
    ["password-changed", () => passwordChangedTemplate({ name: "Ada", when })],
    [
      "username-changed",
      () =>
        usernameChangedTemplate({ name: "Ada", previous: "ada", username: "ada-dev", holdDays: 30, when }),
    ],
    ["deleted", () => accountDeletedTemplate({ name: "Ada", username: "ada", when })],
  ])("%s", async (_name, build) => {
    const { subject, text } = await build();
    expect(`Subject: ${subject}\n\n${text}`).toMatchSnapshot();
  });
});
