import { describe, expect, it } from "vitest";
import { checkPasswordStrength, hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import {
  generateSessionToken,
  hashSessionToken,
  sessionCookieName,
  sessionExpiry,
  shouldRenewSession,
} from "@/lib/auth/tokens";

const FAST = { N: 1024, r: 8, p: 1 } as const;

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery", FAST);
    expect(hash).toMatch(/^scrypt\$1024\$8\$1\$/);
    expect(await verifyPassword("correct horse battery", hash)).toBe(true);
    expect(await verifyPassword("correct horse batterY", hash)).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("same password", FAST)).not.toBe(await hashPassword("same password", FAST));
  });

  it("normalizes Unicode so visually identical passwords match", async () => {
    const hash = await hashPassword("café-password", FAST);
    expect(await verifyPassword("café-password", hash)).toBe(true);
  });

  it("returns false for malformed hashes", async () => {
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
    expect(await verifyPassword("x", "bcrypt$1$2$3$4$5")).toBe(false);
    expect(await verifyPassword("x", "scrypt$abc$8$1$c2FsdA$a2V5")).toBe(false);
  });

  it("flags hashes made with weaker parameters", async () => {
    const weak = await hashPassword("password here", FAST);
    expect(needsRehash(weak)).toBe(true);
    expect(needsRehash(weak, FAST)).toBe(false);
  });
});

describe("checkPasswordStrength", () => {
  it("enforces length", () => {
    expect(checkPasswordStrength("short")).toMatch(/at least 10/);
    expect(checkPasswordStrength("x".repeat(129))).toMatch(/at most 128/);
  });
  it("rejects common and repetitive passwords", () => {
    expect(checkPasswordStrength("password123")).toMatch(/too common/);
    expect(checkPasswordStrength("aaaaaaaaaaaa")).toMatch(/repeating/);
  });
  it("rejects passwords containing the username or email", () => {
    expect(checkPasswordStrength("alice-is-great-42", ["alice"])).toMatch(/username or email/);
  });
  it("accepts a decent passphrase", () => {
    expect(checkPasswordStrength("purple tractor sings", ["alice"])).toBeNull();
  });
});

describe("session tokens", () => {
  it("are random, URL-safe and stored hashed", () => {
    const a = generateSessionToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateSessionToken()).not.toBe(a);
    expect(hashSessionToken(a)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(a)).toBe(hashSessionToken(a));
  });

  it("expire after 30 days and renew in the last 15", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const exp = sessionExpiry(now);
    expect(exp.toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(shouldRenewSession(exp, now)).toBe(false);
    expect(shouldRenewSession(new Date("2026-01-10T00:00:00Z"), now)).toBe(true);
  });

  it("use the __Host- prefix over https", () => {
    expect(sessionCookieName("https:")).toBe("__Host-session");
    expect(sessionCookieName("http:")).toBe("session");
  });
});
