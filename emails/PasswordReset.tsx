import { Action, EmailLayout, Notice, Paragraph } from "./components/EmailLayout";
import { previewSite, type SiteInfo } from "./components/theme";

export interface PasswordResetProps {
  site: SiteInfo;
  name: string;
  url: string;
  minutes: number;
}

export const passwordResetSubject = (p: Pick<PasswordResetProps, "site">) =>
  `Reset your ${p.site.name} password`;

export default function PasswordReset({ site, name, url, minutes }: PasswordResetProps) {
  return (
    <EmailLayout
      site={site}
      preview={`Choose a new password. This link works for ${minutes} minutes.`}
      heading="Reset your password"
      reason={`You're receiving this because a password reset was requested for your ${site.name} account.`}
    >
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        We received a request to reset the password for your account. Choose a new one with the button below.
      </Paragraph>
      <Action href={url} label="Choose a new password" />
      <Notice>
        This link works for {minutes} minutes and can be used once. Didn&apos;t ask for this? You can safely
        ignore this email: your password stays the same, and nobody can change it without this link.
      </Notice>
    </EmailLayout>
  );
}

PasswordReset.PreviewProps = {
  site: previewSite,
  name: "Ada",
  url: "https://stackcase.vercel.app/reset-password?token=preview",
  minutes: 60,
} satisfies PasswordResetProps;
