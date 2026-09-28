import { portfolioImage } from "@/lib/og";
import { lookupPublicPortfolio } from "@/lib/portfolio/queries";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const result = await lookupPublicPortfolio((await params).username);
  if (result.type !== "found") return new Response("Not found", { status: 404 });
  return portfolioImage(result.portfolio);
}
