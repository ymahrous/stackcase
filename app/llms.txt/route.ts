import { facts, faqs, steps } from "@/app/(marketing)/content";
import { listPublishedPortfolios } from "@/lib/portfolio/queries";
import { siteLlmsTxt } from "@/lib/seo";

export const revalidate = 3600;

/** /llms.txt: a plain-text description of the product and its public portfolios for AI assistants. */
export async function GET() {
  const portfolios = await listPublishedPortfolios(500);
  return new Response(siteLlmsTxt({ facts, steps, faqs, portfolios }), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
