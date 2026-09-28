// @vitest-environment node
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const { sendEmail } = await import("@/lib/email/send");

const email = { to: "ada@example.com", tag: "verify-email", subject: "Hi", html: "<p>Hi</p>", text: "Hi" };

describe("sendEmail", () => {
  afterEach(() => {
    send.mockReset();
    vi.restoreAllMocks();
  });

  it("sends through Resend with the sender, reply-to, tag and idempotency key", async () => {
    send.mockResolvedValue({ data: { id: "re_1" }, error: null });
    const result = await sendEmail(
      { ...email, idempotencyKey: "k1" },
      {
        RESEND_API_KEY: "re_key",
        EMAIL_REPLY_TO: "help@example.com",
      },
    );
    expect(result).toEqual({ ok: true, id: "re_1" });
    expect(send).toHaveBeenCalledWith(
      {
        from: "Stackcase <onboarding@resend.dev>",
        to: "ada@example.com",
        subject: "Hi",
        html: "<p>Hi</p>",
        text: "Hi",
        replyTo: "help@example.com",
        tags: [{ name: "category", value: "verify-email" }],
      },
      { idempotencyKey: "k1" },
    );
  });

  it("reports Resend errors instead of throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    send.mockResolvedValue({ data: null, error: { message: "domain not verified" } });
    expect(await sendEmail(email, { RESEND_API_KEY: "re_key" })).toEqual({
      ok: false,
      error: "domain not verified",
    });
    send.mockRejectedValue(new Error("network down"));
    expect(await sendEmail(email, { RESEND_API_KEY: "re_key" })).toEqual({
      ok: false,
      error: "Email could not be sent.",
    });
  });

  it("writes emails to a folder for end-to-end tests", async () => {
    const dir = await mkdtemp(join(tmpdir(), "outbox-"));
    const result = await sendEmail(email, { EMAIL_TRANSPORT: "file", EMAIL_OUTBOX_DIR: dir });
    expect(result.ok).toBe(true);
    const [file] = await readdir(dir);
    expect(JSON.parse(await readFile(join(dir, file!), "utf8"))).toMatchObject({
      to: "ada@example.com",
      tag: "verify-email",
    });
  });

  it("prints in development and skips without leaking content in production", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await sendEmail(email, { NODE_ENV: "development" })).toEqual({ ok: true, id: "console" });
    expect(info.mock.calls[0]![0]).toContain("verify-email → ada@example.com");
    expect(await sendEmail(email, { NODE_ENV: "production" })).toEqual({
      ok: false,
      error: "Email is not configured.",
    });
    expect(warn.mock.calls[0]![0]).not.toContain("Hi");
  });
});
