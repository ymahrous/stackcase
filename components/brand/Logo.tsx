import { MARK } from "@/lib/brand-mark";
import { siteConfig } from "@/lib/site";

/** The mark alone. Decorative by default; pass a title when it stands without the wordmark. */
export function LogoMark({ size = 30, title }: { size?: number; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${MARK.size} ${MARK.size}`}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
      className="logo-mark"
    >
      <rect width={MARK.size} height={MARK.size} rx={MARK.radius} fill={MARK.colors.tile} />
      <path
        d={MARK.body}
        fill="none"
        stroke={MARK.colors.ink}
        strokeWidth={MARK.stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={MARK.base}
        fill="none"
        stroke={MARK.colors.accent}
        strokeWidth={MARK.stroke}
        strokeLinecap="butt"
      />
      <circle cx={MARK.baseCap.cx} cy={MARK.baseCap.cy} r={MARK.stroke / 2} fill={MARK.colors.accent} />
    </svg>
  );
}

/** Mark plus wordmark. The visible name is the accessible name. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo-word">{siteConfig.name}</span>
    </span>
  );
}
