// Renders the brand mark to every static file browsers, app launchers, search engines and email clients use.
// Usage: node scripts/generate-brand-assets.ts   (needs Playwright's Chromium; re-run after changing lib/brand-mark.ts)
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { markSvg } from "../lib/brand-mark.ts";

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

async function png(svg: string, size: number, path: string) {
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.locator("svg").screenshot({ path, omitBackground: true });
  await browser.close();
}

await writeFile("app/icon.svg", markSvg({ size: 32 }) + "\n");
await writeFile("public/logo.svg", markSvg({ size: 512 }) + "\n");
await png(markSvg({ size: 180, rounded: false }), 180, "app/apple-icon.png"); // iOS applies its own mask
await png(markSvg({ size: 192 }), 192, "public/icon-192.png");
await png(markSvg({ size: 512 }), 512, "public/icon-512.png");
// Maskable icons keep the mark inside the central 80% safe zone; launchers crop the rest.
await png(markSvg({ size: 512, padding: 6, rounded: false }), 512, "public/icon-maskable-512.png");
await png(markSvg({ size: 512, rounded: false }), 512, "public/logo.png"); // Organization logo for search engines
await png(markSvg({ size: 96 }), 96, "public/email-logo.png"); // shown at 28px in emails (retina-sharp)
await png(markSvg({ size: 48 }), 48, "public/favicon-48.png");
console.log("Brand assets written.");
