import Link from "next/link";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { PublishForm } from "@/components/dashboard/PublishForm";
import { CheckIcon } from "@/components/Icons";
import { requireUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/queries";
import { checklistProgress, portfolioChecklist, publishBlockers } from "@/lib/portfolio/types";
import { portfolioAddress, portfolioUrl } from "@/lib/site";

export const metadata = { title: "Overview" };

type Props = { searchParams: Promise<{ welcome?: string; verified?: string; reset?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const user = await requireUser();
  const portfolio = (await getPortfolioForUser(user.id))!;
  const { welcome, verified, reset } = await searchParams;
  const notice = verified ? "Email confirmed. Thanks!" : reset ? "Password changed. You're signed in." : null;
  const checklist = portfolioChecklist(portfolio);
  const progress = checklistProgress(checklist);
  const blockers = publishBlockers(portfolio);
  const url = portfolioUrl(user.username);

  return (
    <>
      <div className="ui-page-head">
        <div>
          <h1>{welcome ? `Welcome, ${portfolio.displayName.split(" ")[0]}` : "Your portfolio"}</h1>
          <p>
            {welcome
              ? `${portfolioAddress(user.username)} is yours. Fill in the checklist, then publish when it's ready.`
              : "Edit your content, then check how it looks before you share it."}
          </p>
        </div>
        <Link className="btn" href="/dashboard/preview">
          Preview
        </Link>
      </div>

      {notice ? (
        <p className="ui-msg success" role="status" style={{ marginBottom: 20 }}>
          {notice}
        </p>
      ) : null}
      <div className="ui-grid">
        <div>
          <section className="ui-card" aria-labelledby="setup-h">
            <h2 id="setup-h">Setup checklist</h2>
            <p>{progress}% complete. Portfolios with projects and a clear headline get read, not skimmed.</p>
            <div
              className="ui-progress"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Setup progress"
            >
              <i style={{ width: `${progress}%` }} />
            </div>
            <ul className="ui-checklist">
              {checklist.map((item) => (
                <li key={item.id} className={item.done ? "done" : undefined}>
                  <span className="tick" aria-hidden="true">
                    {item.done ? <CheckIcon /> : null}
                  </span>
                  <span>
                    {item.label}
                    <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                  </span>
                  {!item.done && item.id !== "publish" ? <Link href={item.href}>Do it</Link> : null}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div>
          <section className="ui-card" aria-labelledby="address-h">
            <h2 id="address-h">Your address</h2>
            <p>
              {portfolio.published ? (
                <span className="ui-pill live">● Live</span>
              ) : (
                <span className="ui-pill draft">Draft · only you can see it</span>
              )}
            </p>
            <div className="ui-url">
              {portfolio.published ? (
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {portfolioAddress(user.username)}
                </a>
              ) : (
                <span>{portfolioAddress(user.username)}</span>
              )}
              <CopyButton text={url} />
            </div>
            <p className="ui-hint" style={{ marginTop: 12 }}>
              Change it any time in <Link href="/dashboard/settings">Settings</Link>. Old links keep working.
            </p>
          </section>
          <section className="ui-card" aria-labelledby="publish-h">
            <h2 id="publish-h">{portfolio.published ? "Published" : "Ready to go live?"}</h2>
            <p>
              {portfolio.published
                ? "Search engines can index your page. Unpublish to hide it."
                : blockers.length
                  ? `Before publishing: ${blockers.join(" ")}`
                  : "Publishing makes your page public and lets search engines find it."}
            </p>
            <PublishForm published={portfolio.published} />
          </section>
        </div>
      </div>
    </>
  );
}
