import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RESERVED_USERNAMES,
  checkUsernameFormat,
  normalizeUsername,
  suggestUsername,
  usernameAlternatives,
} from "@/lib/username";

describe("checkUsernameFormat", () => {
  it("accepts valid DNS-safe names", () => {
    for (const name of ["abc", "alice", "a1b2", "jane-doe", "x".repeat(30)])
      expect(checkUsernameFormat(name)).toBeNull();
  });
  it("reports the first rule broken", () => {
    expect(checkUsernameFormat("ab")).toBe("too-short");
    expect(checkUsernameFormat("x".repeat(31))).toBe("too-long");
    expect(checkUsernameFormat("-alice")).toBe("format");
    expect(checkUsernameFormat("alice-")).toBe("format");
    expect(checkUsernameFormat("Alice")).toBe("format");
    expect(checkUsernameFormat("al_ice")).toBe("format");
    expect(checkUsernameFormat("xn--abc")).toBe("double-hyphen");
    expect(checkUsernameFormat("www")).toBe("reserved");
    expect(checkUsernameFormat("dashboard")).toBe("reserved");
  });
  it("reserves every top-level route, so no username can shadow a page", () => {
    const topLevel = readdirSync(join(process.cwd(), "app"), { withFileTypes: true })
      .map((d) => d.name.replace(/\.(tsx?|css)$/, ""))
      .filter((n) => !n.startsWith("(") && !n.startsWith("[") && !n.startsWith("_") && !n.includes("."))
      .filter((n) => !["layout", "globals", "not-found", "robots", "sitemap", "manifest"].includes(n));
    expect(topLevel).toEqual(expect.arrayContaining(["api", "dashboard", "og"]));
    for (const name of topLevel) expect(RESERVED_USERNAMES.has(name), name).toBe(true);
    const groups = readdirSync(join(process.cwd(), "app"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name.startsWith("("))
      .map((d) => d.name);
    expect(groups).toEqual(expect.arrayContaining(["(auth)", "(legal)", "(marketing)"]));
    const groupRoutes = groups.flatMap((g) =>
      readdirSync(join(process.cwd(), "app", g), { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name),
    );
    for (const name of groupRoutes) expect(RESERVED_USERNAMES.has(name), name).toBe(true);
  });

  it("reserves legal and compliance addresses", () => {
    for (const name of [
      "privacy",
      "terms",
      "accessibility",
      "legal",
      "cookies",
      "imprint",
      "impressum",
      "dmca",
    ]) {
      expect(RESERVED_USERNAMES.has(name), name).toBe(true);
    }
  });

  it("reserves every infrastructure name the router depends on", () => {
    for (const name of ["www", "api", "app", "admin", "mail", "dashboard", "login", "signup", "sites"]) {
      expect(RESERVED_USERNAMES.has(name)).toBe(true);
    }
  });
});

describe("normalizeUsername", () => {
  it("trims and lowercases", () => {
    expect(normalizeUsername("  Alice ")).toBe("alice");
  });
});

describe("suggestUsername", () => {
  it("turns free text into a valid username", () => {
    expect(suggestUsername("José Ramírez")).toBe("jose-ramirez");
    expect(suggestUsername("__ada__")).toBe("ada");
    expect(checkUsernameFormat(suggestUsername("A very long name that keeps going and going"))).toBeNull();
  });
  it("pads short or reserved results", () => {
    expect(checkUsernameFormat(suggestUsername("x"))).toBeNull();
    expect(checkUsernameFormat(suggestUsername("admin"))).toBeNull();
    expect(checkUsernameFormat(suggestUsername("!!!"))).toBeNull();
  });
});

describe("usernameAlternatives", () => {
  it("returns valid, distinct alternatives", () => {
    const alts = usernameAlternatives("alice");
    expect(alts).toEqual(["alice-dev", "alice-2", "alice-3"]);
    for (const a of usernameAlternatives("x".repeat(30), 3)) expect(checkUsernameFormat(a)).toBeNull();
  });
});
