import { lookupPublicPortfolio } from "@/lib/portfolio/queries";
import { portfolioLlmsTxt } from "@/lib/seo";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const result = await lookupPublicPortfolio((await params).username);
  if (result.type !== "found") return new Response("Not found", { status: 404 });
  return new Response(portfolioLlmsTxt(result.portfolio), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300",
    },
  });
}
