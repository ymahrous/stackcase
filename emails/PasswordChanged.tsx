import { Action, EmailLayout, Facts, Notice, Paragraph } from "./components/EmailLayout";
import { formatWhen, link, previewSite, type SiteInfo } from "./components/theme";

export interface PasswordChangedProps {
  site: SiteInfo;
  name: string;
  when: Date;
}

export const passwordChangedSubject = (p: Pick<PasswordChangedProps, "site">) =>
  `Your ${p.site.name} password was changed`;

export default function PasswordChanged({ site, name, when }: PasswordChangedProps) {
  return (
    <EmailLayout
      site={site}
      preview="Security notice: if this was you, there's nothing to do."
      heading="Your password was changed"
      reason={`You're receiving this security notice because it concerns your ${site.name} account.`}
    >
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        The password for your account was just changed. For your security, every other device was signed out.
      </Paragraph>
      <Facts
        rows={[
          ["What changed", "Password"],
          ["When", formatWhen(when)],
        ]}
      />
      <Notice>
        <b>Wasn&apos;t you?</b> Reset your password right away. The reset link goes only to this inbox.
      </Notice>
      <Action href={link(site, "/forgot-password")} label="Reset my password" />
    </EmailLayout>
  );
}

PasswordChanged.PreviewProps = {
  site: previewSite,
  name: "Ada",
  when: new Date("2026-09-28T07:15:00Z"),
} satisfies PasswordChangedProps;
