import { contactLinks } from "@/lib/legal";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * RFC 9116 security.txt: tells researchers where to report vulnerabilities. Reports go to GitHub's private
 * vulnerability reporting on the Stackcase repository (never a public issue), and the policy is in the Terms.
 */
export function GET() {
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    `Contact: ${contactLinks.privateReport}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Policy: ${absoluteUrl("/terms#acceptable-use")}`,
    `Canonical: ${absoluteUrl("/.well-known/security.txt")}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
