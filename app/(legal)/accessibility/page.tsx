import type { Metadata } from "next";
import { ExternalLink } from "@/components/ExternalLink";
import {
  Contact,
  LegalDocument,
  PublicIssueNotice,
  type LegalSection,
} from "@/components/legal/LegalDocument";
import { LEGAL_UPDATED, operator } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: `${siteConfig.name}'s commitment to WCAG 2.2 AA, what we test, known limitations, and how to report a barrier.`,
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  const op = operator();
  const name = siteConfig.name;

  const sections: LegalSection[] = [
    {
      id: "commitment",
      title: "Our commitment",
      body: (
        <p>
          We want everyone to be able to build and read a {name} portfolio, including people who use screen
          readers, keyboards, voice control, magnification or high-contrast settings. Recruiters with
          disabilities read portfolios too.
        </p>
      ),
    },
    {
      id: "standard",
      title: "Standard and conformance status",
      body: (
        <>
          <p>
            Our target is the <b>Web Content Accessibility Guidelines (WCAG) 2.2, level AA</b>, the
            international standard that accessibility laws and public-sector standards around the world refer
            to.
          </p>
          <p>
            <b>Status: partially conformant.</b> The pages and features we build pass automated checks for
            WCAG 2.2 AA and are designed to meet it. Automated tools can&apos;t catch every issue, we
            haven&apos;t yet had an independent audit, and content that users write themselves may not conform
            (see section 5).
          </p>
        </>
      ),
    },
    {
      id: "measures",
      title: "What we do",
      body: (
        <ul>
          <li>
            Automated axe-core checks against WCAG 2.0, 2.1 and 2.2 A/AA on every key page and step of the
            sign-up, editing, publishing and password-reset journeys, in light and dark mode, on desktop and
            mobile, on every code change.
          </li>
          <li>
            Every portfolio design option (color mode, heading font, layout and accent) is tested for contrast
            and checked with axe on real pages, so owners can&apos;t choose a combination that fails AA. The
            design editor&apos;s live preview is described in text for screen reader users.
          </li>
          <li>
            A skip link, semantic landmarks, one <code>h1</code> per page with no skipped heading levels,
            labelled form fields, and errors that are announced and linked to their field.
          </li>
          <li>Everything works with a keyboard, with a visible focus indicator.</li>
          <li>
            Text and interactive elements meet contrast minimums in both color themes, including every
            portfolio accent color.
          </li>
          <li>
            Pages reflow to 320 CSS pixels without horizontal scrolling and support 200% text zoom. Animation
            respects &ldquo;reduce motion&rdquo; settings.
          </li>
          <li>
            There are no time limits on tasks. The only expiring items are email links, which you can request
            again.
          </li>
          <li>
            The example portfolio on the home page is decorative, so it&apos;s hidden from assistive
            technology and the keyboard, and described in text.
          </li>
        </ul>
      ),
    },
    {
      id: "compatibility",
      title: "Compatibility",
      body: (
        <p>
          {name} is designed to work with current versions of Chrome, Edge, Firefox and Safari, and with
          common assistive technologies, including NVDA, JAWS, VoiceOver and TalkBack. It relies on HTML, CSS,
          WAI-ARIA and JavaScript. Reading pages, and the username form on the home page, work without
          JavaScript.
        </p>
      ),
    },
    {
      id: "limitations",
      title: "Known limitations",
      body: (
        <ul>
          <li>
            <b>User-written content.</b> Portfolio text, project descriptions and link targets are written by
            users. We structure them accessibly, but we can&apos;t guarantee their wording, reading level or
            the accessibility of external sites they link to.
          </li>
          <li>
            <b>Social preview images</b> (shown when a link is shared) contain text drawn as an image. The
            same text is always available on the page and in the image&apos;s alternative text.
          </li>
          <li>
            <b>Email.</b> Account emails include a plain-text version; some email apps may show the formatted
            version differently.
          </li>
        </ul>
      ),
    },
    {
      id: "feedback",
      title: "Feedback and alternative formats",
      body: (
        <>
          <p>
            If you find a barrier, or need information in another format, tell us: <Contact operator={op} />
            <br />
            Please give the page address and what happened. We aim to reply within 5 business days and to fix
            confirmed issues as quickly as we can, providing the information another way in the meantime.
          </p>
          <PublicIssueNotice operator={op} />
        </>
      ),
    },
    {
      id: "enforcement",
      title: "Enforcement",
      body: (
        <p>
          If you&apos;re not satisfied with our response, you can contact the authority responsible for
          accessibility or equality where you live, if there is one. Nothing in this statement limits the
          rights that law gives you.
        </p>
      ),
    },
    {
      id: "preparation",
      title: "How we prepared this statement",
      body: (
        <p>
          This statement was prepared on {LEGAL_UPDATED} from a self-assessment, automated testing (axe-core
          in our continuous integration pipeline) and manual keyboard checks. We review it whenever we make
          significant changes and at least once a year.
        </p>
      ),
    },
  ];

  return (
    <LegalDocument
      path="/accessibility"
      title="Accessibility Statement"
      sections={sections}
      summary={
        <p>
          <b>In short:</b> we build {name} to WCAG 2.2 AA, test every key page automatically on every change,
          and fix reported barriers quickly. If something doesn&apos;t work for you, open an issue on{" "}
          <ExternalLink href={op.contactUrl}>GitHub</ExternalLink>.
        </p>
      }
    />
  );
}
