import { Action, EmailLayout, Notice, Paragraph } from "./components/EmailLayout";
import { previewSite, type SiteInfo } from "./components/theme";

export interface VerifyEmailProps {
  site: SiteInfo;
  name: string;
  url: string;
  hours: number;
}

export const verifyEmailSubject = (p: Pick<VerifyEmailProps, "site">) =>
  `Confirm your email for ${p.site.name}`;

export default function VerifyEmail({ site, name, url, hours }: VerifyEmailProps) {
  return (
    <EmailLayout
      site={site}
      preview={`One click to confirm your address. The link works for ${hours} hours.`}
      heading="Confirm your email"
      reason={`You're receiving this because this address was used to create a ${site.name} account.`}
    >
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        Welcome to {site.name}. Confirm this address so you can always get back into your account, for example
        to reset a forgotten password.
      </Paragraph>
      <Action href={url} label="Confirm my email" />
      <Notice>
        This link works for {hours} hours and can be used once. If you didn&apos;t create an account, ignore
        this email and nothing will happen.
      </Notice>
    </EmailLayout>
  );
}

VerifyEmail.PreviewProps = {
  site: previewSite,
  name: "Ada",
  url: "https://stackcase.vercel.app/verify-email?token=preview",
  hours: 24,
} satisfies VerifyEmailProps;
