import Link from "next/link";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { requireUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/queries";
import { portfolioAddress } from "@/lib/site";

export const metadata = { title: "Preview" };

/** Full-page preview that works before publishing. Rendered under the dashboard layout, so it is noindex. */
export default async function PreviewPage() {
  const user = await requireUser("/dashboard/preview");
  const portfolio = (await getPortfolioForUser(user.id))!;
  return (
    <div style={{ marginInline: "calc(50% - 50vw)", marginBlock: "-36px -80px" }}>
      <div className="ui-preview-bar">
        <div className="wrap">
          <span>
            Preview of <b>{portfolioAddress(user.username)}</b>
            {portfolio.published ? "" : " · not published yet"}
          </span>
          <Link href="/dashboard">Back to editing</Link>
        </div>
      </div>
      <PortfolioView portfolio={portfolio} nested />
    </div>
  );
}
