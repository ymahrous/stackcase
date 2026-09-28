// @vitest-environment node
/**
 * Property-based tests: instead of a handful of examples, fast-check generates thousands of inputs
 * (including hostile ones) and checks that invariants always hold. A failure prints the smallest input
 * that breaks the rule.
 */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { formatWhen } from "@/emails/components/theme";
import { safeNextPath } from "@/lib/routing";
import { serializeJsonLd, truncate } from "@/lib/seo";
import { ALLOWED_QUERY_PARAMS, redactUrl } from "@/lib/telemetry";
import {
  checkUsernameFormat,
  normalizeUsername,
  suggestUsername,
  usernameAlternatives,
  USERNAME_MAX,
} from "@/lib/username";
import { optionalUrl, splitList } from "@/lib/validation";

const RUNS = { numRuns: 500 };
const ORIGIN = "https://stackcase.test";

/** Strings built from characters attackers like: slashes, backslashes, controls, schemes, unicode. */
const hostile = fc.string({
  unit: fc.constantFrom(..."/\\:.@?#%&=-_ \t\n\r\u0000\u2028aZ9é漢javascript".split("")),
  maxLength: 40,
});

describe("safeNextPath never leaves the site", () => {
  it("for arbitrary strings", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), hostile, fc.webUrl()), (input) => {
        const out = safeNextPath(input);
        expect(out.startsWith("/")).toBe(true);
        expect(out.startsWith("//")).toBe(false);
        expect(new URL(out, ORIGIN).origin).toBe(ORIGIN);
        expect(out).not.toMatch(/[\u0000- \\]/);
      }),
      RUNS,
    );
  });

  it("keeps ordinary same-site paths intact", () => {
    const segment = fc.stringMatching(/^[a-z0-9-]{1,12}$/);
    fc.assert(
      fc.property(fc.array(segment, { minLength: 1, maxLength: 4 }), (parts) => {
        const path = `/${parts.join("/")}`;
        expect(safeNextPath(path)).toBe(path);
      }),
      RUNS,
    );
  });
});

describe("usernames", () => {
  it("normalizing is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(normalizeUsername(normalizeUsername(s))).toBe(normalizeUsername(s));
      }),
      RUNS,
    );
  });

  it("suggestions from any text are always valid usernames", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.emailAddress(), hostile), (source) => {
        const suggestion = suggestUsername(source);
        expect(checkUsernameFormat(suggestion), suggestion).toBeNull();
      }),
      RUNS,
    );
  });

  it("alternatives are valid, distinct and never the original", () => {
    const valid = fc.stringMatching(/^[a-z][a-z0-9]{2,20}$/).filter((u) => checkUsernameFormat(u) === null);
    fc.assert(
      fc.property(valid, (username) => {
        const alts = usernameAlternatives(username);
        expect(new Set(alts).size).toBe(alts.length);
        for (const alt of alts) {
          expect(alt).not.toBe(username);
          expect(alt.length).toBeLessThanOrEqual(USERNAME_MAX);
          expect(checkUsernameFormat(alt), alt).toBeNull();
        }
      }),
      RUNS,
    );
  });
});

describe("URL fields accept only web addresses", () => {
  const schema = optionalUrl("Link");
  it("every accepted value is an absolute http(s) URL with a dotted host", () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), hostile, fc.webUrl(), fc.domain()), (input) => {
        const r = schema.safeParse(input);
        if (!r.success || r.data === null) return;
        const url = new URL(r.data);
        expect(["http:", "https:"]).toContain(url.protocol);
        expect(url.hostname).toContain(".");
      }),
      RUNS,
    );
  });

  it("dangerous schemes are always rejected", () => {
    const scheme = fc.constantFrom("javascript:", "JavaScript:", "data:", "vbscript:", "file:", "blob:");
    fc.assert(
      fc.property(scheme, fc.string(), (s, rest) => {
        const r = schema.safeParse(`${s}${rest}`);
        expect(r.success && r.data !== null).toBe(false);
      }),
      RUNS,
    );
  });
});

describe("text helpers", () => {
  it("splitList trims, drops blanks and removes case-insensitive duplicates", () => {
    fc.assert(
      fc.property(fc.array(fc.string({ maxLength: 12 }), { maxLength: 20 }), (items) => {
        const out = splitList(items.join(","), /,/);
        expect(out.every((x) => x === x.trim() && x.length > 0)).toBe(true);
        expect(new Set(out.map((x) => x.toLowerCase())).size).toBe(out.length);
      }),
      RUNS,
    );
  });

  it("truncate never exceeds the limit", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 400 }), fc.integer({ min: 20, max: 300 }), (text, max) => {
        expect(truncate(text, max).length).toBeLessThanOrEqual(max);
      }),
      RUNS,
    );
  });

  it("serialized JSON-LD can't close its <script> tag and round-trips exactly", () => {
    fc.assert(
      fc.property(fc.jsonValue(), fc.string(), (value, text) => {
        const data = { value, text: `${text}</script><script>alert(1)</script>` };
        const out = serializeJsonLd(data);
        expect(out).not.toMatch(/<\/?script/i);
        expect(out).not.toMatch(/[<>\u2028\u2029]/);
        expect(JSON.parse(out)).toEqual(JSON.parse(JSON.stringify(data)));
      }),
      RUNS,
    );
  });
});

describe("analytics URL redaction", () => {
  it("never forwards a query parameter outside the allow-list", () => {
    const key = fc.oneof(
      fc.constantFrom(...ALLOWED_QUERY_PARAMS),
      fc.string({ minLength: 1, maxLength: 10 }),
    );
    const params = fc.array(fc.tuple(key, fc.string({ maxLength: 10 })), { maxLength: 6 });
    fc.assert(
      fc.property(fc.webPath(), params, (path, pairs) => {
        const url = new URL(ORIGIN);
        url.pathname = path || "/";
        for (const [k, v] of pairs) url.searchParams.append(k, v);
        url.hash = "secret";
        const out = redactUrl(url.toString());
        if (out === null) return;
        const cleaned = new URL(out);
        expect(cleaned.hash).toBe("");
        for (const k of cleaned.searchParams.keys()) expect(ALLOWED_QUERY_PARAMS.has(k)).toBe(true);
      }),
      RUNS,
    );
  });
});

describe("email dates", () => {
  it("formatWhen always prints a UTC time in one fixed shape", () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date("1970-01-01"), max: new Date("2200-01-01"), noInvalidDate: true }),
        (d) => {
          expect(formatWhen(d)).toMatch(
            /^\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}, \d{2}:\d{2} UTC$/,
          );
        },
      ),
      RUNS,
    );
  });
});
