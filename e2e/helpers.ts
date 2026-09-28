import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { OUTBOX_DIR } from "../playwright.config";

export const PORT = Number(process.env.PORT ?? 3100);
export const ORIGIN = `http://localhost:${PORT}`;
export const portfolio = (username: string, path = "") => `${ORIGIN}/${username}${path}`;

export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

export function uniqueName(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

interface SentEmail {
  id: string;
  to: string;
  tag: string;
  subject: string;
  text: string;
}

/** Waits for the newest email with this tag to arrive for an address, and returns it. */
export async function waitForEmail(to: string, tag: string, after = 0): Promise<SentEmail> {
  let found: SentEmail | undefined;
  await expect
    .poll(
      async () => {
        const files = (await readdir(OUTBOX_DIR).catch(() => [] as string[])).sort();
        const emails = await Promise.all(
          files.map(async (f) => JSON.parse(await readFile(join(OUTBOX_DIR, f), "utf8")) as SentEmail),
        );
        const matches = emails.filter((e) => e.to === to && e.tag === tag);
        found = matches.length > after ? matches[matches.length - 1] : undefined;
        return Boolean(found);
      },
      { timeout: 10_000, message: `waiting for "${tag}" email to ${to}` },
    )
    .toBe(true);
  return found!;
}

export function linkIn(email: SentEmail): string {
  const match = /https?:\/\/\S+/.exec(email.text);
  if (!match) throw new Error(`No link in ${email.tag} email`);
  return match[0];
}
