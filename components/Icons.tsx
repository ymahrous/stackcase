import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = { "aria-hidden": true, focusable: false } as const;

export function GitHubIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...base} {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38v-1.33c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...base} {...props}>
      <path d="M3.6 5.6H1.2V15h2.4V5.6ZM2.4 1.2a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8ZM15 9.7c0-2.5-1.3-4.3-3.6-4.3-1.2 0-2 .6-2.4 1.3V5.6H6.7V15h2.4v-4.9c0-1.2.4-2.3 1.7-2.3 1.3 0 1.4 1.2 1.4 2.4V15H15V9.7Z" />
    </svg>
  );
}

export function ArrowDownIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" {...base} {...props}>
      <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" />
    </svg>
  );
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" {...base} {...props}>
      <path d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9" />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" {...base} {...props}>
      <path d="M5.5 4 1.5 8l4 4M10.5 4l4 4-4 4" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" {...base} {...props}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M1.5 8h13M8 1.5c2 2 2.8 4.2 2.8 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.2 5.7 5.2 8S6 12.5 8 14.5" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" {...base} {...props}>
      <rect x="1.5" y="3" width="13" height="10" rx="1.5" />
      <path d="m2 4 6 5 6-5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" {...base} {...props}>
      <path d="m3 8.5 3.2 3L13 4.5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" {...base} {...props}>
      <circle cx="7" cy="7" r="4.8" />
      <path d="m10.5 10.5 4 4" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" {...base} {...props}>
      <path d="M6.5 9.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2L8 3.8M9.5 6.5a3 3 0 0 0-4.2 0L2.7 9.1a3 3 0 0 0 4.2 4.2L8 12.2" />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      {...base}
      {...props}
    >
      <path d="M9 1.5 3 9h4.5L7 14.5 13 7H8.5L9 1.5Z" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" {...base} {...props}>
      <path d="M1 8s2.6-5 7-5 7 5 7 5-2.6 5-7 5-7-5-7-5Z" />
      <circle cx="8" cy="8" r="2.2" />
    </svg>
  );
}

export function PaletteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" {...base} {...props}>
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13c1 0 1.5-.6 1.5-1.4 0-.9-.8-1.2-.8-2 0-.8.7-1.3 1.5-1.3h1.6A2.7 2.7 0 0 0 14.5 7C14.5 4 11.6 1.5 8 1.5Z" />
      <circle cx="5" cy="7" r=".9" fill="currentColor" />
      <circle cx="7.5" cy="4.6" r=".9" fill="currentColor" />
      <circle cx="10.6" cy="5.2" r=".9" fill="currentColor" />
    </svg>
  );
}

export function ArrowsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" {...base} {...props}>
      <path d="M2 5.5h10.5M10 3l2.5 2.5L10 8M14 10.5H3.5M6 8l-2.5 2.5L6 13" />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" {...base} {...props}>
      <path d="M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9.5 1.5ZM9.5 1.5V5H13M5.5 8.5h5M5.5 11h5" />
    </svg>
  );
}
