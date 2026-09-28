import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";
import { MINIMUM_AGE, operator } from "@/lib/legal";
import { siteConfig } from "@/lib/site";
import { USERNAME_HOLD_DAYS } from "@/lib/username";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses and protects personal data, and your rights under GDPR, UK GDPR, CCPA/CPRA, LGPD, PIPEDA, Egypt's PDPL and other laws.`,
  alternates: { canonical: "/privacy" },
};

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="legal-table" role="region" aria-label={head.join(", ")} tabIndex={0}>
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {c}
                  </th>
                ) : (
                  <td key={i}>{c}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacyPage() {
  const op = operator();
  const name = siteConfig.name;

  const sections: LegalSection[] = [
    {
      id: "who",
      title: "Who we are",
      body: (
        <>
          <p>
            {op.name} ({siteConfig.host}) is the <b>controller</b> of your personal data (called the
            &ldquo;business&rdquo; under the CCPA and the &ldquo;data controller&rdquo; or &ldquo;personal
            information controller&rdquo; under other laws). You can reach us at:
          </p>
          <p>
            <Contact operator={op} />
          </p>
          {op.euRepresentative ? <p>EU representative (GDPR Art. 27): {op.euRepresentative}</p> : null}
          {op.ukRepresentative ? <p>UK representative (UK GDPR Art. 27): {op.ukRepresentative}</p> : null}
          <p>
            This policy covers the {name} website, dashboard and the public portfolios we host. It does not
            cover other websites that portfolios link to.
          </p>
        </>
      ),
    },
    {
      id: "data",
      title: "What we collect and why",
      body: (
        <>
          <p>
            We collect only what the service needs. We don&apos;t buy data, and we don&apos;t use advertising
            trackers.
          </p>
          <Table
            head={["Data", "Why", "Legal basis (GDPR/UK GDPR)"]}
            rows={[
              [
                "Email address",
                "Log in, account emails (confirmation, password reset, security notices)",
                "Contract (Art. 6(1)(b))",
              ],
              ["Password", "Log in. We store only a salted scrypt hash, never the password", "Contract"],
              ["Username", "Your portfolio address and log-in identity", "Contract"],
              [
                "Portfolio content: name, optional pronouns, headline, location, bio, links (including an optional résumé link), public email, projects, skills, search title and description",
                "Show your portfolio. Published content is public. Pronouns are optional and shown only if you add them",
                "Contract",
              ],
              [
                "Design choices: accent color, color mode, font, layout and which sections show",
                "Display your portfolio the way you chose",
                "Contract",
              ],
              [
                "Consent record: date and version of the terms you accepted",
                "Prove what you agreed to",
                "Legal obligation and legitimate interests (Art. 6(1)(c), (f))",
              ],
              ["Session cookie and session record", "Keep you logged in", "Contract; strictly necessary"],
              [
                "IP address and email in rate-limit counters",
                "Stop password guessing, spam and abuse",
                "Legitimate interests (security)",
              ],
              [
                "Email confirmation and reset links (stored hashed)",
                "Confirm your address; reset your password",
                "Contract",
              ],
              [
                "Server logs (IP address, user agent, URL, time)",
                "Keep the service running and secure; investigate errors",
                "Legitimate interests",
              ],
              [
                "Anonymous usage and performance statistics",
                "Understand which pages work and how fast they load",
                "Legitimate interests",
              ],
            ]}
          />
          <p>
            We do not collect special-category or sensitive data (such as health, religion or biometrics), and
            we ask you not to put it in your portfolio. We don&apos;t make decisions about you by automated
            means that have legal or similarly significant effects, and we don&apos;t profile you.
          </p>
        </>
      ),
    },
    {
      id: "public",
      title: "Your public portfolio",
      body: (
        <>
          <p>
            Your portfolio is private until you publish it. Once published, everything on it is public at{" "}
            {siteConfig.host}/your-username. It is listed in our sitemap and in machine-readable files for
            search engines and AI assistants, and anyone can view, copy or index it.
          </p>
          <p>
            You can unpublish or delete it at any time, and we stop serving it immediately. We can&apos;t
            delete copies that search engines, archives or other people have already made. Most search engines
            let you request removal of outdated results.
          </p>
          <p>
            If you change your username, your old address redirects to the new one for {USERNAME_HOLD_DAYS}{" "}
            days.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and similar technologies",
      body: (
        <>
          <p>
            We use <b>one cookie</b>: a session cookie that keeps you logged in (named{" "}
            <code>__Host-session</code>, lasting up to 30 days and renewed while you use the site). It is
            strictly necessary, so under the EU ePrivacy Directive (Art. 5(3)), the UK PECR and similar laws
            it doesn&apos;t require consent. That&apos;s why there is no cookie banner.
          </p>
          <p>
            Our analytics and performance measurement (Vercel Web Analytics and Speed Insights) use{" "}
            <b>no cookies</b> and no cross-site identifiers. Visits are counted with a hash of the request
            that is discarded after 24 hours. Before any page address is sent, we remove query parameters and
            exclude password reset and email confirmation pages entirely.
          </p>
          <p>We honor Global Privacy Control signals, though we have no tracking to switch off.</p>
        </>
      ),
    },
    {
      id: "sharing",
      title: "Who processes your data",
      body: (
        <>
          <p>
            We share personal data only with service providers (processors) that run parts of {name} for us,
            under contracts that limit them to our instructions:
          </p>
          <Table
            head={["Provider", "What they do", "Location"]}
            rows={[
              [
                "Vercel Inc.",
                "Hosting, content delivery, server logs, analytics and performance statistics",
                "USA and global edge network",
              ],
              [op.databaseProvider, "Database hosting and backups", "As configured by the operator"],
              ["Resend (Plus Five Five, Inc.)", "Sending account emails", "USA"],
            ]}
          />
          <p>
            We may disclose data if the law requires it, to protect people&apos;s safety or rights, or as part
            of a merger or sale of the service. If a sale happens, this policy continues to apply.
          </p>
          <p>
            <b>We do not sell or share personal information</b> as the CCPA/CPRA defines those terms, and we
            don&apos;t use it for targeted advertising.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      title: "International transfers",
      body: (
        <p>
          Our providers may process data outside your country, including in the United States. For transfers
          from the EEA, UK or Switzerland, we rely on adequacy decisions (such as the EU-US Data Privacy
          Framework, where the provider is certified), the European Commission&apos;s Standard Contractual
          Clauses, or the UK International Data Transfer Addendum, together with supplementary safeguards.
          Similar mechanisms cover transfers under Brazil&apos;s LGPD, Egypt&apos;s Personal Data Protection
          Law (Law No. 151 of 2020) and other laws that restrict cross-border transfers. Contact us for a copy
          of the relevant safeguards.
        </p>
      ),
    },
    {
      id: "retention",
      title: "How long we keep data",
      body: (
        <Table
          head={["Data", "Kept for"]}
          rows={[
            ["Account and portfolio", "Until you delete your account. Deletion is immediate in our database"],
            ["Database backups", `Up to ${op.backupRetentionDays} days after deletion, then overwritten`],
            ["Sessions", "Up to 30 days of inactivity; removed when you log out"],
            [
              "Email links",
              "24 hours (confirmation) or 60 minutes (reset); records removed within a day of expiry or use",
            ],
            [
              "Rate-limit counters (IP address, email)",
              "The limit window (up to 1 hour), then removed within a day",
            ],
            ["Previous usernames", `${USERNAME_HOLD_DAYS} days, so old links keep working`],
            ["Server logs", "As set by our hosting plan, typically up to 30 days"],
            ["Analytics", "Aggregate statistics only; visitor hashes are discarded after 24 hours"],
            ["Sent email records at Resend", "According to Resend's retention period"],
          ]}
        />
      ),
    },
    {
      id: "rights",
      title: "Your rights",
      body: (
        <>
          <p>Depending on where you live, you have some or all of these rights. We give them to everyone:</p>
          <ul>
            <li>
              <b>Access and portability.</b> Download a copy of your data from{" "}
              <Link href="/dashboard/settings">Settings → Download your data</Link> (machine-readable JSON),
              or ask us.
            </li>
            <li>
              <b>Correction.</b> Edit your details in the dashboard, or ask us.
            </li>
            <li>
              <b>Deletion.</b> Delete your account in Settings; it takes effect immediately.
            </li>
            <li>
              <b>Objection and restriction.</b> Object to processing based on legitimate interests, or ask us
              to limit it.
            </li>
            <li>
              <b>Withdraw consent</b> where processing is based on consent.
            </li>
            <li>
              <b>Opt out of sale, sharing or targeted advertising.</b> We don&apos;t do any of these.
            </li>
            <li>
              <b>No discrimination</b> for exercising your rights.
            </li>
            <li>
              <b>Complain</b> to a data protection authority. For example: your EU/EEA supervisory authority,
              the UK Information Commissioner&apos;s Office, the California Privacy Protection Agency,
              Brazil&apos;s ANPD, the Office of the Privacy Commissioner of Canada, the Office of the
              Australian Information Commissioner, or Egypt&apos;s Personal Data Protection Center. We&apos;d
              appreciate the chance to help first.
            </li>
          </ul>
          <p>
            To make a request, email <a href={`mailto:${op.email}`}>{op.email}</a> from your account&apos;s
            address, or through an authorized agent where the law allows. We may need to verify your identity.
            We respond within the time the law sets (for example, one month under GDPR and UK GDPR, 45 days
            under the CCPA, and 15 days under the LGPD). Requests are free unless they are manifestly
            unfounded or excessive. If we refuse a request, we&apos;ll explain why and how to appeal. US
            residents of states with an appeal right can appeal by replying to our decision.
          </p>
        </>
      ),
    },
    {
      id: "jurisdictions",
      title: "Region-specific information",
      body: (
        <>
          <h3>European Economic Area, United Kingdom and Switzerland</h3>
          <p>
            The legal bases are listed in section 2. You have the rights in GDPR Articles 15–22 (UK GDPR
            equivalents; the Swiss revised FADP). Where we rely on legitimate interests, we have balanced them
            against your rights; ask us for details.
          </p>
          <h3>United States (California and other states)</h3>
          <p>
            In the last 12 months we collected these CCPA categories: identifiers (email, username, IP
            address), customer records (account details), internet activity (server logs, aggregated usage),
            approximate location derived from IP address in aggregated analytics, and professional information
            you choose to publish. We collected them from you and your device, for the purposes in section 2.
            We don&apos;t sell or share them, and we don&apos;t use sensitive personal information to infer
            characteristics. The same applies under the privacy laws of Virginia, Colorado, Connecticut, Utah,
            Texas, Oregon and other states.
          </p>
          <h3>Canada</h3>
          <p>
            We handle personal information according to PIPEDA and applicable provincial laws, including
            Québec&apos;s Law 25. Our privacy contact is listed in section 1.
          </p>
          <h3>Brazil</h3>
          <p>
            Under the LGPD you have the rights in Article 18, including confirmation of processing, access,
            correction, anonymization, portability, deletion, information about sharing, and revoking consent.
            The legal bases correspond to Article 7 (performance of a contract, legitimate interest, legal
            obligation).
          </p>
          <h3>Egypt and the Middle East</h3>
          <p>
            We process data in line with Egypt&apos;s Personal Data Protection Law (Law No. 151 of 2020),
            including your rights to know, access, correct, restrict and object, and the safeguards for
            cross-border transfers. Similar principles apply under the UAE&apos;s PDPL and Saudi Arabia&apos;s
            PDPL.
          </p>
          <h3>Asia-Pacific and Africa</h3>
          <p>
            We also respect the rights given by Australia&apos;s Privacy Act 1988 (Australian Privacy
            Principles), Japan&apos;s APPI, South Korea&apos;s PIPA, Singapore&apos;s PDPA, India&apos;s
            Digital Personal Data Protection Act 2023, China&apos;s PIPL, South Africa&apos;s POPIA,
            Nigeria&apos;s NDPA and Kenya&apos;s Data Protection Act. Contact us to exercise them.
          </p>
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      body: (
        <>
          <p>We protect your data with:</p>
          <ul>
            <li>HTTPS everywhere with HSTS, and a strict Content Security Policy</li>
            <li>passwords hashed with scrypt; session and email-link tokens stored only as hashes</li>
            <li>secure, HttpOnly session cookies, and rate limits against guessing and abuse</li>
            <li>a check of who owns the data on every change, and automated security tests</li>
          </ul>
          <p>
            No system is perfectly secure. If a breach puts your data at risk, we&apos;ll notify you and the
            relevant authorities as the law requires (for example, within 72 hours of becoming aware under
            GDPR).
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      body: (
        <p>
          {name} is not for children. You must be at least {MINIMUM_AGE} to create an account. That is the
          highest digital-consent age in the EU (GDPR Art. 8), and above the US COPPA threshold of 13. We
          don&apos;t knowingly collect data from younger children; if you believe a child has created an
          account, contact us and we&apos;ll delete it.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to this policy",
      body: (
        <p>
          We&apos;ll post any changes here and update the date and version at the top. For material changes,
          we&apos;ll give you notice by email or in the dashboard before they take effect.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact",
      body: (
        <p>
          Questions or requests about privacy: <Contact operator={op} />
        </p>
      ),
    },
  ];

  return (
    <LegalDocument
      path="/privacy"
      title="Privacy Policy"
      operator={op}
      sections={sections}
      summary={
        <>
          <p>
            <b>In short:</b>
          </p>
          <ul>
            <li>
              We collect what&apos;s needed to run your account and portfolio, and nothing for advertising.
            </li>
            <li>Your portfolio is private until you publish it; then it&apos;s public.</li>
            <li>One strictly necessary cookie. Analytics are cookieless and anonymous.</li>
            <li>We never sell your data.</li>
            <li>You can download or delete everything from Settings, at any time.</li>
          </ul>
        </>
      }
    />
  );
}
