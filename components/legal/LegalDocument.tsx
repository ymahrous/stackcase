import type { ReactNode } from "react";
import { ExternalLink } from "@/components/ExternalLink";
import { JsonLd } from "@/components/JsonLd";
import { LEGAL_UPDATED, LEGAL_VERSION, type Operator } from "@/lib/legal";
import { absoluteUrl, siteConfig } from "@/lib/site";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

interface LegalDocumentProps {
  path: string;
  title: string;
  summary: ReactNode;
  sections: LegalSection[];
}

/**
 * Shared layout for the privacy policy, terms and accessibility statement: plain-language summary first,
 * a table of contents with anchor links, then numbered sections. Numbering is meaningful: sections are cited.
 */
export function LegalDocument({ path, title, summary, sections }: LegalDocumentProps) {
  const url = absoluteUrl(path);
  return (
    <article className="legal" aria-labelledby="legal-title">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "@id": `${url}#page`,
              url,
              name: `${title} · ${siteConfig.name}`,
              inLanguage: "en",
              dateModified: LEGAL_VERSION,
              isPartOf: { "@type": "WebSite", name: siteConfig.name, url: absoluteUrl("/") },
              publisher: { "@type": "Organization", name: siteConfig.name, url: absoluteUrl("/") },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: siteConfig.name, item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: title, item: url },
              ],
            },
          ],
        }}
      />
      <header className="legal-head">
        <span className="label">Legal</span>
        <h1 id="legal-title">{title}</h1>
        <p className="legal-meta">
          Last updated <time dateTime={LEGAL_VERSION}>{LEGAL_UPDATED}</time> · Version {LEGAL_VERSION}
        </p>
        <div className="legal-summary">{summary}</div>
      </header>
      <nav className="legal-toc" aria-label="Contents">
        <h2>Contents</h2>
        <ol>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="legal-body">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
            <h2 id={`${s.id}-h`}>
              {i + 1}. {s.title}
            </h2>
            {s.body}
          </section>
        ))}
      </div>
    </article>
  );
}

/** How to reach us: GitHub issues, since Stackcase has no contact email. */
export function Contact({ operator }: { operator: Operator }) {
  return (
    <>
      <b>{operator.name}</b>
      <br />
      Open an issue on GitHub:{" "}
      <ExternalLink href={operator.contactUrl}>{operator.contactUrl.replace(/^https:\/\//, "")}</ExternalLink>
    </>
  );
}

/** Reminder shown wherever we ask people to open an issue. */
export function PublicIssueNotice({ operator }: { operator: Operator }) {
  return (
    <p>
      <b>GitHub issues are public.</b> Don&apos;t include your email address, password or other personal data.
      For anything that must stay private, such as a security problem or a report that names a person, use{" "}
      <ExternalLink href={operator.privateReportUrl}>GitHub&apos;s private reporting</ExternalLink> instead.
      You need a free GitHub account for either; if that&apos;s a barrier, someone you trust can open the
      issue for you.
    </p>
  );
}
