import { EmailLayout, Facts, Mono, Paragraph } from "./components/EmailLayout";
import { formatWhen, previewSite, type SiteInfo } from "./components/theme";

export interface AccountDeletedProps {
  site: SiteInfo;
  name: string;
  username: string;
  when: Date;
}

export const accountDeletedSubject = (p: Pick<AccountDeletedProps, "site">) =>
  `Your ${p.site.name} account was deleted`;

export default function AccountDeleted({ site, name, username, when }: AccountDeletedProps) {
  return (
    <EmailLayout
      site={site}
      preview="Your account, portfolio and all their content have been removed."
      heading="Your account was deleted"
      reason={`This is the last email you'll receive from ${site.name} about this account.`}
    >
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>
        As requested, your account has been deleted, together with your portfolio, projects, skills and
        sessions.
      </Paragraph>
      <Facts
        rows={[
          ["Portfolio", <Mono key="p">{`${site.host}/${username}`}</Mono>],
          ["Deleted", formatWhen(when)],
        ]}
      />
      <Paragraph>
        Copies in backups expire on their normal schedule, as described in our Privacy Policy. Thanks for
        trying {site.name}. You&apos;re welcome back any time.
      </Paragraph>
    </EmailLayout>
  );
}

AccountDeleted.PreviewProps = {
  site: previewSite,
  name: "Ada",
  username: "ada",
  when: new Date("2026-09-28T07:15:00Z"),
} satisfies AccountDeletedProps;
