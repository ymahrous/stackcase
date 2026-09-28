import type { AnchorHTMLAttributes, ReactNode } from "react";

interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> {
  href: string;
  children: ReactNode;
  /** Extra rel tokens, e.g. "me" for profile links or "nofollow ugc" for user-supplied links. */
  rel?: string;
}

/** Link to another site. Opens in a new tab without leaking window.opener or the referrer. */
export function ExternalLink({ href, children, rel, ...rest }: ExternalLinkProps) {
  const tokens = new Set(["noopener", "noreferrer", ...(rel ? rel.split(/\s+/).filter(Boolean) : [])]);
  return (
    <a href={href} target="_blank" rel={[...tokens].join(" ")} {...rest}>
      {children}
    </a>
  );
}
