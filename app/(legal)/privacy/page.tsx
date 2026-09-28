import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "@/components/ExternalLink";
import {
  Contact,
  LegalDocument,
  PublicIssueNotice,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { CONSENT_COOKIE, CONSENT_MAX_AGE_DAYS } from "@/lib/consent";
import { MINIMUM_AGE, operator } from "@/lib/legal";
import { siteConfig } from "@/lib/site";
import { USERNAME_HOLD_DAYS } from "@/lib/username";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} collects, uses and protects personal data, and the privacy rights it gives everyone, wherever they live.`,
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
            {op.name} ({siteConfig.host}) is the <b>controller</b> of your personal data: we decide why and
            how it is used. {name} is an open-source project offered online to people worldwide, and it
            isn&apos;t directed at any particular country. We don&apos;t have local offices or appointed local
            representatives, and we don&apos;t offer contact by email. You can reach us at:
          </p>
          <p>
            <Contact operator={op} />
          </p>
          <PublicIssueNotice operator={op} />
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
            head={["Data", "Why", "Legal basis"]}
            rows={[
              [
                "Email address",
                "Log in, account emails (confirmation, password reset, security notices)",
                "Contract",
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
                "Legal obligation and legitimate interests",
              ],
              ["Session cookie and session record", "Keep you logged in", "Contract; strictly necessary"],
              [
                "Your analytics choice (a cookie in your browser)",
                "Remember whether you allowed analytics, so we don't ask on every page",
                "Legal obligation (keeping a record of consent)",
              ],
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
                "Anonymous usage and performance statistics (only if you allow them)",
                "Understand which pages work and how fast they load",
                "Consent, which you can withdraw at any time",
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
          <p>We use two cookies. Neither is used for advertising or to follow you across other websites.</p>
          <Table
            head={["Cookie", "Purpose", "Lasts"]}
            rows={[
              [
                "__Host-session",
                "Keeps you logged in. Strictly necessary, so it doesn't need consent",
                "Up to 30 days, renewed while you use the site",
              ],
              [
                CONSENT_COOKIE,
                "Remembers whether you allowed analytics",
                `${CONSENT_MAX_AGE_DAYS} days, then we ask again`,
              ],
            ]}
          />
          <p>
            <b>Analytics only run if you allow them.</b> On your first visit we ask whether we may use Vercel
            Web Analytics and Speed Insights to count page views and measure loading speed. They set no
            cookies and use no cross-site identifiers, and visits are counted with a hash of the request that
            is discarded after 24 hours. We still ask first, because they run a script that sends information
            from your device. Before any page address is sent, we remove query parameters and exclude password
            reset and email confirmation pages entirely.
          </p>
          <p>
            Declining changes nothing else about the site. You can change your choice at any time with the
            &ldquo;Cookie settings&rdquo; link at the bottom of our pages, or under &ldquo;Cookies and
            analytics&rdquo; in your account Settings. If your browser sends a Global Privacy Control signal,
            we treat it as a refusal and don&apos;t ask.
          </p>
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
            If you contact us on GitHub, GitHub, Inc. (USA) handles what you post under its own{" "}
            <ExternalLink href="https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement">
              privacy statement
            </ExternalLink>
            , as a separate controller, not on our behalf. Issues are public; private reports are visible only
            to you and us.
          </p>
          <p>
            We may disclose data if the law requires it, to protect people&apos;s safety or rights, or as part
            of a merger or sale of the service. If a sale happens, this policy continues to apply.
          </p>
          <p>
            <b>We do not sell or share personal information</b>, for money or for cross-context advertising,
            and we don&apos;t use it for targeted advertising.
          </p>
        </>
      ),
    },
    {
      id: "transfers",
      title: "International transfers",
      body: (
        <p>
          {name} runs on global infrastructure, so your data may be processed outside your country, including
          in the United States. Where a law restricts cross-border transfers, we rely on the safeguards our
          providers offer for it, such as standard contractual clauses or recognized certification schemes.
          Ask us for details through GitHub.
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
            ["Your analytics choice", `${CONSENT_MAX_AGE_DAYS} days in your browser`],
            [
              "GitHub issues and private reports",
              "Until they are no longer needed; ask us to delete an issue that contains your personal data",
            ],
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
          <p>We give these rights to everyone, wherever you live:</p>
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
              <b>Complain</b> to the data protection authority where you live, if there is one. We&apos;d
              appreciate the chance to help first.
            </li>
          </ul>
          <p>
            Most of these you can do yourself in the dashboard. For anything else, open an issue on{" "}
            <ExternalLink href={op.contactUrl}>GitHub</ExternalLink> describing what you need without personal
            details, or ask someone to do it for you where the law allows. To confirm that the account is
            yours, we may ask you to add a short code we give you to your portfolio for a moment. We reply
            within one month, sooner where the law where you live sets a shorter time. Requests are free
            unless they are clearly unfounded or excessive. If we refuse a request, we&apos;ll explain why,
            and you can ask for a second review by replying on the issue.
          </p>
        </>
      ),
    },
    {
      id: "worldwide",
      title: "Wherever you live",
      body: (
        <>
          <p>
            We apply this one policy to everyone. It is built on the principles shared by data protection laws
            around the world, such as the EU and UK GDPR, the California CCPA/CPRA, Brazil&apos;s LGPD,
            Canada&apos;s PIPEDA and similar laws elsewhere: collect little, say why, keep it safe, delete it
            when it&apos;s no longer needed, and let people see, fix, take and delete their data.
          </p>
          <p>
            If the law where you live gives you rights or protections beyond this policy, you have them too,
            and nothing here takes them away. We don&apos;t claim that this policy meets every requirement of
            every country&apos;s law.
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
            relevant authorities without undue delay, as the law requires.
          </p>
        </>
      ),
    },
    {
      id: "children",
      title: "Children",
      body: (
        <p>
          {name} is not for children. You must be at least {MINIMUM_AGE} to create an account, or older if the
          law where you live sets a higher age for using online services without a parent&apos;s consent. We
          don&apos;t knowingly collect data from younger children; if you believe a child has created an
          account, tell us through GitHub (privately, without naming the child in a public issue) and
          we&apos;ll delete it.
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
            <li>No advertising cookies. Anonymous, cookieless analytics run only if you allow them.</li>
            <li>We don&apos;t offer support by email: reach us through GitHub issues.</li>
            <li>We never sell your data.</li>
            <li>You can download or delete everything from Settings, at any time.</li>
          </ul>
        </>
      }
    />
  );
}
