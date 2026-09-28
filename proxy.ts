import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAMES } from "@/lib/auth/cookie-names";
import { decideRoute } from "@/lib/routing";

/**
 * Canonicalizes portfolio URLs and bounces signed-out visitors away from /dashboard before rendering.
 * The cookie check is only a fast path; every dashboard page verifies the session in the database.
 */
export function proxy(request: NextRequest) {
  const decision = decideRoute({
    pathname: request.nextUrl.pathname,
    search: request.nextUrl.search,
    hasSessionCookie: SESSION_COOKIE_NAMES.some((name) => request.cookies.has(name)),
  });
  if (decision.type === "redirect") return NextResponse.redirect(decision.url, decision.status);
  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files in /public.
  matcher: [
    "/((?!_next/static|_next/image|_next/data|fonts/|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff2?)$).*)",
  ],
};
