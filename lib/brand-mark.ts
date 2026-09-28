/**
 * The Stackcase mark: an "S" drawn as three stacked lines, the bottom one in cobalt, the "case" the stack
 * rests on. One set of shapes on a 32×32 grid feeds the React logo, the favicon, app icons and social images.
 */
export const MARK = {
  size: 32,
  radius: 8,
  stroke: 3.2,
  /** Top line, first turn, middle line, second turn. Ends where the accent line begins. */
  body: "M22.5 9.5H12.25a3.25 3.25 0 0 0 0 6.5h7.5a3.25 3.25 0 0 1 0 6.5",
  /** Bottom line (butt-capped on the right so the join with the curve stays clean). */
  base: "M19.75 22.5H9.5",
  baseCap: { cx: 9.5, cy: 22.5 },
  colors: { tile: "#141A18", ink: "#F5F6F3", accent: "#6F8BFF" },
} as const;

/** Standalone SVG markup of the mark, for static files and image generation. */
export function markSvg({ size = 32, padding = 0, rounded = true } = {}): string {
  const s = MARK.size + padding * 2;
  const r = rounded ? MARK.radius + padding * 0.5 : 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-padding} ${-padding} ${s} ${s}"><title>Stackcase</title><rect x="${-padding}" y="${-padding}" width="${s}" height="${s}" rx="${r}" fill="${MARK.colors.tile}"/><path d="${MARK.body}" fill="none" stroke="${MARK.colors.ink}" stroke-width="${MARK.stroke}" stroke-linecap="round" stroke-linejoin="round"/><path d="${MARK.base}" fill="none" stroke="${MARK.colors.accent}" stroke-width="${MARK.stroke}" stroke-linecap="butt"/><circle cx="${MARK.baseCap.cx}" cy="${MARK.baseCap.cy}" r="${MARK.stroke / 2}" fill="${MARK.colors.accent}"/></svg>`;
}
