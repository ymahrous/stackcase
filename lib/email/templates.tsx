import { render } from "@react-email/render";
import type { ReactElement } from "react";
import AccountDeleted, { accountDeletedSubject } from "@/emails/AccountDeleted";
import { plainTextOptions, type SiteInfo } from "@/emails/components/theme";
import PasswordChanged, { passwordChangedSubject } from "@/emails/PasswordChanged";
import PasswordReset, { passwordResetSubject } from "@/emails/PasswordReset";
import UsernameChanged, { usernameChangedSubject } from "@/emails/UsernameChanged";
import VerifyEmail, { verifyEmailSubject } from "@/emails/VerifyEmail";
import { contactLinks } from "@/lib/legal";
import { siteConfig } from "@/lib/site";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/** The deployment details every template receives. */
export function siteInfo(): SiteInfo {
  return {
    name: siteConfig.name,
    url: siteConfig.url,
    host: siteConfig.host,
    supportUrl: contactLinks.issues,
  };
}

/**
 * Renders a React Email template to HTML and a plain-text alternative. Sending both improves
 * deliverability and accessibility (screen readers, text-only clients). React escapes all user text.
 */
export async function renderEmail(subject: string, element: ReactElement): Promise<RenderedEmail> {
  const [html, text] = await Promise.all([
    render(element),
    render(element, {
      plainText: true,
      htmlToTextOptions: plainTextOptions,
    }),
  ]);
  return { subject, html, text: text.trim() };
}

export function verifyEmailTemplate(p: { name: string; url: string; hours?: number }) {
  const site = siteInfo();
  return renderEmail(verifyEmailSubject({ site }), <VerifyEmail site={site} {...p} hours={p.hours ?? 24} />);
}

export function passwordResetTemplate(p: { name: string; url: string; minutes: number }) {
  const site = siteInfo();
  return renderEmail(passwordResetSubject({ site }), <PasswordReset site={site} {...p} />);
}

export function passwordChangedTemplate(p: { name: string; when?: Date }) {
  const site = siteInfo();
  return renderEmail(
    passwordChangedSubject({ site }),
    <PasswordChanged site={site} when={p.when ?? new Date()} name={p.name} />,
  );
}

export function usernameChangedTemplate(p: {
  name: string;
  previous: string;
  username: string;
  holdDays: number;
  when?: Date;
}) {
  const site = siteInfo();
  return renderEmail(
    usernameChangedSubject({ site, username: p.username }),
    <UsernameChanged site={site} {...p} when={p.when ?? new Date()} />,
  );
}

export function accountDeletedTemplate(p: { name: string; username: string; when?: Date }) {
  const site = siteInfo();
  return renderEmail(
    accountDeletedSubject({ site }),
    <AccountDeleted site={site} {...p} when={p.when ?? new Date()} />,
  );
}
