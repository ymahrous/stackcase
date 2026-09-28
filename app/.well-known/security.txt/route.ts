import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * RFC 9116 security.txt: tells researchers where to report vulnerabilities.
 * Set SECURITY_CONTACT to a mailto: or https: URL; without it the file isn't served.
 */
export function GET() {
  const contact = process.env.SECURITY_CONTACT?.trim();
  if (!contact || !/^(mailto:|https:\/\/)/.test(contact)) return new Response("Not found", { status: 404 });
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    `Contact: ${contact}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${absoluteUrl("/.well-known/security.txt")}`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
