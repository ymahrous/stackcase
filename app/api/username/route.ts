import { NextResponse, type NextRequest } from "next/server";
import { getUsernameStatus } from "@/lib/account";
import { getCurrentUser } from "@/lib/auth/session";
import { clientIpFrom, consumeRateLimit, limits } from "@/lib/rate-limit";

/** GET /api/username?u=alice -> { available, username, message, suggestions } */
export async function GET(request: NextRequest) {
  const rl = await consumeRateLimit(`username:${clientIpFrom(request.headers)}`, limits.usernameCheck);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }
  const input = request.nextUrl.searchParams.get("u") ?? "";
  const user = await getCurrentUser();
  const status = await getUsernameStatus(input.slice(0, 64), user?.id);
  return NextResponse.json(status, { headers: { "Cache-Control": "no-store" } });
}
