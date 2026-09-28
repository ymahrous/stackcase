// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const registerOTel = vi.fn();
vi.mock("@vercel/otel", () => ({ registerOTel }));

describe("instrumentation", () => {
  it("registers OpenTelemetry under the stackcase service name", async () => {
    const { register } = await import("@/instrumentation");
    register();
    expect(registerOTel).toHaveBeenCalledWith({ serviceName: "stackcase" });
  });
});

describe("emailEnv", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("reads only the email settings from the environment", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_x");
    vi.stubEnv("EMAIL_FROM", "Stackcase <hi@mail.example.com>");
    vi.stubEnv("EMAIL_TRANSPORT", "file");
    const { emailEnv } = await import("@/lib/email/config");
    expect(emailEnv()).toMatchObject({
      RESEND_API_KEY: "re_x",
      EMAIL_FROM: "Stackcase <hi@mail.example.com>",
      EMAIL_TRANSPORT: "file",
    });
    expect(Object.keys(emailEnv()).sort()).toEqual([
      "EMAIL_FROM",
      "EMAIL_OUTBOX_DIR",
      "EMAIL_REPLY_TO",
      "EMAIL_TRANSPORT",
      "NODE_ENV",
      "RESEND_API_KEY",
    ]);
  });
});
