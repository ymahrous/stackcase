import type { ReactNode } from "react";
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
  operator: Operator;
}

/**
 * Shared layout for the privacy policy, terms and accessibility statement: plain-language summary first,
 * a table of contents with anchor links, then numbered sections. Numbering is meaningful: sections are cited.
 */
export function LegalDocument({ path, title, summary, sections, operator }: LegalDocumentProps) {
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
        {operator.complete ? null : (
          <p className="ui-msg error legal-config" role="note">
            Contact details are incomplete. Set LEGAL_CONTACT_EMAIL (or EMAIL_REPLY_TO) before launch.
          </p>
        )}
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

export function Contact({ operator }: { operator: Operator }) {
  return (
    <>
      <b>{operator.name}</b>
      <br />
      Open an issue here: <a href={`mailto:${operator.email}`}>{operator.email}</a>
    </>
  );
}
