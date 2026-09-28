import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { PortfolioData } from "@/lib/portfolio/types";
import { markSvg } from "@/lib/brand-mark";
import { portfolioAddress, siteConfig } from "@/lib/site";
import { technologies } from "@/lib/seo";

export const OG_SIZE = { width: 1200, height: 630 } as const;

const accentHex: Record<PortfolioData["accent"], string> = {
  COBALT: "#2B4FD8",
  EMERALD: "#0B7A55",
  CRIMSON: "#C0263D",
  AMBER: "#9A5B00",
  VIOLET: "#6D3FD1",
  GRAPHITE: "#2F3A36",
};

const accentHexDark: Record<PortfolioData["accent"], string> = {
  COBALT: "#8EA2FF",
  EMERALD: "#4FD1A1",
  CRIMSON: "#FF8A9A",
  AMBER: "#F5B04C",
  VIOLET: "#B69CFF",
  GRAPHITE: "#C9D3CF",
};

const ink = "#141A18";
const bg = "#F5F6F3";
const muted = "#58625E";

const palettes = {
  light: { bg, ink, muted, chipBg: "#FFFFFF", chipLine: "#DCE1DD" },
  dark: { bg: "#0D1110", ink: "#E7ECE9", muted: "#9AA7A2", chipBg: "#151B19", chipLine: "#27312E" },
} as const;

export type OgPalette = (typeof palettes)[keyof typeof palettes] & { accent: string };

/** Colors for a portfolio's social card: dark when the owner forced dark mode, light otherwise. */
export function ogPalette(p: Pick<PortfolioData, "accent" | "colorMode">): OgPalette {
  return p.colorMode === "DARK"
    ? { ...palettes.dark, accent: accentHexDark[p.accent] }
    : { ...palettes.light, accent: accentHex[p.accent] };
}

let fontCache: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: "normal" }[]> | null = null;

function loadFonts() {
  const dir = join(process.cwd(), "node_modules/@fontsource");
  fontCache ??= Promise.all([
    readFile(join(dir, "bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff")),
    readFile(join(dir, "ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff")),
  ]).then(([display, body]) => [
    { name: "Display", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Body", data: body, weight: 500 as const, style: "normal" as const },
  ]);
  return fontCache;
}

function Chip({ children, palette }: { children: string; palette: OgPalette }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 22,
        padding: "8px 14px",
        borderRadius: 8,
        border: `1.5px solid ${palette.chipLine}`,
        background: palette.chipBg,
      }}
    >
      {children}
    </div>
  );
}

/** 1200x630 social card for a portfolio: name, headline, stack, address. */
export async function portfolioImage(p: PortfolioData) {
  const palette = ogPalette(p);
  const { accent } = palette;
  const stack = technologies(p).slice(0, 5);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: palette.bg,
        color: palette.ink,
        padding: "64px 72px",
        fontFamily: "Body",
        borderTop: `14px solid ${accent}`,
      }}
    >
      <div style={{ display: "flex", fontSize: 26, color: palette.muted }}>
        {portfolioAddress(p.username)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontFamily: "Display", fontSize: 88, lineHeight: 1, letterSpacing: -2 }}>
          {p.displayName}
        </div>
        {p.headline ? (
          <div
            style={{ fontFamily: "Display", fontSize: 46, lineHeight: 1.1, color: accent, letterSpacing: -1 }}
          >
            {p.headline}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {stack.map((t) => (
          <Chip key={t} palette={palette}>
            {t}
          </Chip>
        ))}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: await loadFonts(),
      headers: { "Cache-Control": "public, max-age=0, s-maxage=3600" },
    },
  );
}

function markDataUri(size: number) {
  return `data:image/svg+xml;base64,${Buffer.from(markSvg({ size })).toString("base64")}`;
}

function Brand({ size = 44, color = ink }: { size?: number; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
      <img src={markDataUri(size)} width={size} height={size} />
      <div style={{ fontFamily: "Display", fontSize: size * 0.72, letterSpacing: -1, color }}>
        {siteConfig.name}
      </div>
    </div>
  );
}

/** Social card for the marketing site: logo, promise, and what your address looks like. */
export async function marketingImage(headline: string) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: bg,
        color: ink,
        padding: "64px 72px",
        fontFamily: "Body",
      }}
    >
      <Brand size={56} />
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div
          style={{ fontFamily: "Display", fontSize: 78, lineHeight: 1.02, letterSpacing: -2, maxWidth: 1000 }}
        >
          {headline}
        </div>
        <div style={{ display: "flex", fontSize: 30, color: muted }}>
          Free portfolio builder for software engineers
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            padding: "12px 20px",
            borderRadius: 12,
            border: "2px solid #DCE1DD",
            background: "#FFFFFF",
          }}
        >
          {siteConfig.host}/<span style={{ color: accentHex.COBALT }}>yourname</span>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
