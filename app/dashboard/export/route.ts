import { getCurrentUser } from "@/lib/auth/session";
import { exportUserData } from "@/lib/export";
import { consumeRateLimit, limits } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** GET /dashboard/export: downloads the signed-in user's data as JSON. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Log in to download your data.", { status: 401 });
  const rl = await consumeRateLimit(`export:${user.id}`, limits.sensitive);
  if (!rl.ok) return new Response("Too many downloads. Try again later.", { status: 429 });
  const data = await exportUserData(user.id);
  if (!data) return new Response("Account not found.", { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="stackcase-${user.username}-${date}.json"`,
      "Cache-Control": "no-store, private",
      "X-Robots-Tag": "noindex",
    },
  });
}
