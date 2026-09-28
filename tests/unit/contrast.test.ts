// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ACCENTS } from "@/lib/validation";

/** WCAG 2.x relative luminance and contrast ratio. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
function contrast(a: string, b: string) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x! + 0.05) / (y! + 0.05);
}

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

/** Returns the declarations inside the first rule whose selector is exactly `selector`. */
function block(selector: string, from = 0): string {
  const start = css.indexOf(`${selector} {`, from);
  if (start < 0) throw new Error(`No rule for ${selector}`);
  return css.slice(start, css.indexOf("}", start));
}
function tokens(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)) out[m[1]!] = m[2]!.toLowerCase();
  return out;
}

const THEME_KEYS = ["bg", "surface", "sunk", "ink", "muted", "line", "accent-ink", "signal", "signal-soft"];
const deviceLight = tokens(block(":root"));
const deviceDark = tokens(block(":root", css.indexOf("@media (prefers-color-scheme: dark)")));
const forcedLight = tokens(block('[data-theme="light"]'));
const forcedDark = tokens(block('[data-theme="dark"]'));

const accentPairs = Object.fromEntries(
  ACCENTS.map((a) => {
    const t = tokens(block(`[data-accent="${a}"]`));
    return [a, { light: t["accent-l"]!, dark: t["accent-d"]! }];
  }),
) as Record<(typeof ACCENTS)[number], { light: string; dark: string }>;

describe("color tokens", () => {
  it("defines a light and dark value for every accent", () => {
    for (const a of ACCENTS) {
      expect(accentPairs[a].light, a).toMatch(/^#[0-9a-f]{6}$/);
      expect(accentPairs[a].dark, a).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("forced light and dark modes match the device-driven themes exactly", () => {
    for (const key of THEME_KEYS) {
      expect(forcedLight[key], `light ${key}`).toBe(deviceLight[key]);
      expect(forcedDark[key], `dark ${key}`).toBe(deviceDark[key]);
    }
  });

  it("the marketing site's Cobalt matches the Cobalt portfolio accent", () => {
    expect(deviceLight.accent).toBe(accentPairs.COBALT.light);
    expect(deviceDark.accent).toBe(accentPairs.COBALT.dark);
  });

  it("forced themes also pick the matching accent variant", () => {
    expect(css).toMatch(/\[data-theme="light"\]\[data-accent\] \{\s*--accent: var\(--accent-l\);/);
    expect(css).toMatch(/\[data-theme="dark"\]\[data-accent\] \{\s*--accent: var\(--accent-d\);/);
  });
});

describe("color contrast (WCAG 2.x AA)", () => {
  const themes = { light: deviceLight, dark: deviceDark } as const;
  for (const theme of ["light", "dark"] as const) {
    const t = themes[theme];

    it(`body and muted text are readable in ${theme} (≥ 4.5:1 on page and cards)`, () => {
      for (const bg of [t.bg!, t.surface!]) {
        expect(contrast(t.ink!, bg)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t.muted!, bg)).toBeGreaterThanOrEqual(4.5);
      }
    });

    for (const a of ACCENTS) {
      it(`${a} in ${theme}: accent text ≥ 4.5:1 on page and cards; button text on accent ≥ 4.5:1`, () => {
        const hex = accentPairs[a][theme];
        expect(contrast(hex, t.bg!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(hex, t.surface!)).toBeGreaterThanOrEqual(4.5);
        expect(contrast(t["accent-ink"]!, hex)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});
