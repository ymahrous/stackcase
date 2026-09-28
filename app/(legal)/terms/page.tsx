import type { Metadata } from "next";
import Link from "next/link";
import { Contact, LegalDocument, type LegalSection } from "@/components/legal/LegalDocument";
import { GOVERNING_LAW, MINIMUM_AGE, operator } from "@/lib/legal";
import { siteConfig } from "@/lib/site";
import { USERNAME_HOLD_DAYS } from "@/lib/username";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms for using ${siteConfig.name}: accounts, your content, acceptable use, copyright notices, liability and your consumer rights.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  const op = operator();
  const name = siteConfig.name;

  const sections: LegalSection[] = [
    {
      id: "agreement",
      title: "The agreement",
      body: (
        <>
          <p>
            These terms are an agreement between you and {op.name} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) for
            your use of {name} at {siteConfig.host}. By creating an account or using the service, you agree to
            them and confirm you have read our <Link href="/privacy">Privacy Policy</Link>. If you don&apos;t
            agree, don&apos;t use {name}.
          </p>
          <p>
            If you use {name} for an organization, you confirm you may bind it to these terms. Nothing in
            these terms limits rights you have as a consumer under the law of the country where you live that
            cannot be waived by contract.
          </p>
        </>
      ),
    },
    {
      id: "eligibility",
      title: "Who can use Stackcase",
      body: (
        <p>
          You must be at least {MINIMUM_AGE}, able to form a binding contract, and not barred from using the
          service under applicable law, including sanctions laws. One person, one account. Keep your details
          accurate.
        </p>
      ),
    },
    {
      id: "account",
      title: "Your account",
      body: (
        <ul>
          <li>Keep your password secret. You&apos;re responsible for activity on your account.</li>
          <li>
            Tell us straight away at <a href={`mailto:${op.email}`}>{op.email}</a> if you think someone else
            has access to it.
          </li>
          <li>
            Usernames are first come, first served. We may reclaim or change a username that is reserved,
            impersonates someone, infringes a trademark or is inactive and abusive. Previous usernames
            redirect for {USERNAME_HOLD_DAYS} days after a change.
          </li>
          <li>You can delete your account at any time in Settings.</li>
        </ul>
      ),
    },
    {
      id: "content",
      title: "Your content",
      body: (
        <>
          <p>
            You keep ownership of everything you add: text, links, project descriptions. You give us a
            worldwide, non-exclusive, royalty-free license to host, store, reproduce, format, display and
            distribute it, only to run and promote the service. This includes public portfolio pages, social
            preview images, sitemaps and machine-readable summaries. The license ends when you delete the
            content or your account, except for copies in backups for a limited time and copies others have
            already made of public pages.
          </p>
          <p>You confirm that you have the rights to what you publish, and that it is accurate and lawful.</p>
        </>
      ),
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      body: (
        <>
          <p>Don&apos;t use {name} to:</p>
          <ul>
            <li>break any law, or infringe anyone&apos;s intellectual property, privacy or other rights;</li>
            <li>impersonate a person or organization, or misrepresent your identity, credentials or work;</li>
            <li>
              publish content that is hateful, harassing, threatening, sexually explicit, or exploits minors;
            </li>
            <li>publish other people&apos;s personal data without a legal basis;</li>
            <li>send spam, run phishing, or link to malware or deceptive sites;</li>
            <li>
              probe, scan or test the security of the service without our written permission, bypass rate
              limits or access controls, or disrupt the service;
            </li>
            <li>
              scrape the service in bulk, except for search engines and AI crawlers that follow our
              robots.txt;
            </li>
            <li>create accounts automatically or in bulk.</li>
          </ul>
          <p>
            Found a security issue? Please report it privately at issues here{" "}
            <a href={`mailto:${op.email}`}>{op.email}</a>. We won&apos;t pursue good-faith research that
            follows this policy and doesn&apos;t harm users or data.
          </p>
        </>
      ),
    },
    {
      id: "notices",
      title: "Reporting illegal content and copyright",
      body: (
        <>
          <p>
            Anyone can report content they believe is illegal or infringes their rights by opening a GitHub issue at{" "}
            <a href={`mailto:${op.email}`}>{op.email}</a> with:
          </p>
          <ol>
            <li>the exact URL(s) of the content;</li>
            <li>
              why you believe it is illegal or infringing (for copyright, the work you claim is infringed);
            </li>
            <li>your name and email address (except for reports of child sexual abuse material);</li>
            <li>a statement that the report is accurate and made in good faith;</li>
            <li>
              for copyright claims under the US DMCA, also a statement, under penalty of perjury, that you are
              the owner or authorized to act for the owner, and your physical or electronic signature.
            </li>
          </ol>
          <p>
            We review reports promptly and without bias. We may remove content or restrict accounts, and we
            tell the person affected why, with a statement of reasons as the EU Digital Services Act requires.
            You can contest our decision by replying within six months; a different person will review it. EU
            users may also use a certified out-of-court dispute settlement body. Under the DMCA, you may send
            a counter-notice with the information in 17 U.S.C. § 512(g), and we will handle it as that section
            provides. We close the accounts of repeat infringers.
          </p>
          <p>
            Our single point of contact for authorities and users (DSA Articles 11–12) is{" "}
            <a href={`mailto:${op.email}`}>{op.email}</a>, in English.
          </p>
        </>
      ),
    },
    {
      id: "our-rights",
      title: "Our service and brand",
      body: (
        <p>
          The {name} software, design, name and logo belong to us or our licensors. You may link to {name} and
          mention it truthfully, but not use our brand in a way that suggests endorsement. Feedback you send
          can be used freely to improve the service.
        </p>
      ),
    },
    {
      id: "availability",
      title: "Availability and changes",
      body: (
        <p>
          {name} is currently free. We work to keep it running and secure, but we may change, suspend or end
          features. If we plan to shut the service down, we&apos;ll give at least 30 days&apos; notice where
          reasonably possible so you can download your data. If we ever introduce paid features, we&apos;ll
          set their terms out before you pay.
        </p>
      ),
    },
    {
      id: "termination",
      title: "Suspension and termination",
      body: (
        <p>
          You can stop using {name} and delete your account at any time. We may suspend or close an account,
          or remove content, if you seriously or repeatedly break these terms, if the law requires it, or to
          protect users or the service. Our action will be proportionate, and we&apos;ll give reasons and a
          way to contest it unless the law or safety prevents that. Sections that by their nature should
          survive (such as liability and governing law) continue to apply after termination.
        </p>
      ),
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      body: (
        <p>
          To the extent the law allows, {name} is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
          without warranties of any kind, express or implied, including merchantability, fitness for a
          particular purpose and non-infringement. We don&apos;t guarantee that portfolios will rank in search
          engines or lead to job offers. This section doesn&apos;t affect statutory rights that can&apos;t be
          excluded, such as those under EU and UK consumer law or the Australian Consumer Law.
        </p>
      ),
    },
    {
      id: "liability",
      title: "Limitation of liability",
      body: (
        <>
          <p>
            To the extent the law allows, we are not liable for indirect, incidental, special, consequential
            or punitive damages, or for lost profits, data or opportunities. Our total liability for all
            claims about the service is limited to the greater of the amount you paid us in the 12 months
            before the claim and USD 50.
          </p>
          <p>
            Nothing in these terms excludes or limits liability for death or personal injury caused by
            negligence, for fraud, for gross negligence or willful misconduct, or any other liability that
            cannot be limited by law. If you are a consumer in the EU or UK, we are liable for foreseeable
            loss caused by our breach of these terms or our failure to use reasonable care.
          </p>
        </>
      ),
    },
    {
      id: "indemnity",
      title: "Responsibility for your content",
      body: (
        <p>
          If you use {name} for business, you agree to compensate us for reasonable costs from third-party
          claims caused by your content or your breach of these terms. This section does not apply to
          consumers where the law doesn&apos;t allow it.
        </p>
      ),
    },
    {
      id: "law",
      title: "Governing law and disputes",
      body: (
        <>
          <p>
            {name} is an online service offered to people around the world. These terms are governed by{" "}
            {GOVERNING_LAW}, applied in good faith and with fair dealing. Questions those principles
            don&apos;t answer are decided under the law that the competent court&apos;s conflict-of-law rules
            point to.
          </p>
          <p>
            If you are a consumer, you also keep the protection of the mandatory laws of the country where you
            live, and you may always bring proceedings in the courts of that country (for example, under EU
            Regulation 1215/2012 and the Rome I Regulation, or in the UK). Nothing in these terms removes
            rights that the law says cannot be waived.
          </p>
          <p>
            <b>Resolving disputes.</b> Please contact us first at{" "}
            <a href={`mailto:${op.email}`}>{op.email}</a>. We&apos;ll try in good faith to solve the issue
            within 30 days. If we can&apos;t, either of us may take the dispute to a competent court or, if we
            both agree in writing, to mediation or arbitration.
          </p>
        </>
      ),
    },
    {
      id: "general",
      title: "General",
      body: (
        <ul>
          <li>
            <b>Changes.</b> We may update these terms. For material changes, we&apos;ll give at least 30
            days&apos; notice by email or in the dashboard, unless a change is needed sooner for legal or
            security reasons. If you don&apos;t agree, you can delete your account before the change takes
            effect.
          </li>
          <li>
            <b>Entire agreement.</b> These terms and the Privacy Policy are the whole agreement between us
            about the service.
          </li>
          <li>
            <b>Severability.</b> If part of these terms is unenforceable, the rest stays in effect.
          </li>
          <li>
            <b>No waiver.</b> Not enforcing a term is not a waiver.
          </li>
          <li>
            <b>Transfer.</b> We may transfer these terms as part of a merger or sale of the service, and your
            rights won&apos;t be reduced. You may not transfer your account.
          </li>
          <li>
            <b>Events beyond control.</b> Neither of us is responsible for delays caused by events beyond
            reasonable control.
          </li>
          <li>
            <b>Language.</b> These terms are written in English. Translations are for convenience; where the
            law allows, the English version prevails.
          </li>
        </ul>
      ),
    },
    {
      id: "operator",
      title: "Operator information and contact",
      body: (
        <p>
          The service is provided by: <Contact operator={op} />
        </p>
      ),
    },
  ];

  return (
    <LegalDocument
      path="/terms"
      title="Terms of Service"
      operator={op}
      sections={sections}
      summary={
        <>
          <p>
            <b>In short:</b>
          </p>
          <ul>
            <li>You must be {MINIMUM_AGE}+. Keep your password safe.</li>
            <li>You own your content. You let us host and show it so your portfolio works.</li>
            <li>Be honest, lawful and respectful. No spam, impersonation or abuse.</li>
            <li>
              Report illegal or infringing content by email. We explain our decisions, and you can appeal.
            </li>
            <li>The service is free and provided as is, and your consumer rights still apply.</li>
          </ul>
        </>
      }
    />
  );
}
