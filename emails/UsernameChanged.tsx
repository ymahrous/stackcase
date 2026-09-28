import { Link } from "@react-email/components";
import { Action, EmailLayout, Facts, Mono, Notice, Paragraph } from "./components/EmailLayout";
import { formatWhen, link, previewSite, type SiteInfo, theme } from "./components/theme";

export interface UsernameChangedProps {
  site: SiteInfo;
  name: string;
  previous: string;
  username: string;
  holdDays: number;
  when: Date;
}

export const usernameChangedSubject = (p: Pick<UsernameChangedProps, "site" | "username">) =>
  `Your portfolio link is now ${p.site.host}/${p.username}`;

export default function UsernameChanged({
  site,
  name,
  previous,
  username,
  holdDays,
  when,
}: UsernameChangedProps) {
  const oldAddress = `${site.host}/${previous}`;
  const newAddress = `${site.host}/${username}`;
  return (
    <EmailLayout
      site={site}
      preview={`Links to ${oldAddress} redirect to your new address for ${holdDays} days.`}
      heading="Your portfolio has a new link"
      reason={`You're receiving this because the username on your ${site.name} account changed.`}
    >
      <Paragraph>Hi {name},</Paragraph>
      <Paragraph>Your username was changed. Here is what that means for your portfolio link:</Paragraph>
      <Facts
        rows={[
          ["Old address", <Mono key="o">{oldAddress}</Mono>],
          ["New address", <Mono key="n">{newAddress}</Mono>],
          ["Redirect", `${holdDays} days from the old address`],
          ["When", formatWhen(when)],
        ]}
      />
      <Paragraph>
        Update your CV, LinkedIn and GitHub profile with the new link. Nobody else can claim your old username
        while it redirects.
      </Paragraph>
      <Action href={link(site, `/${username}`)} label="Open my portfolio" />
      <Notice>
        <b>Wasn&apos;t you?</b> Someone may have access to your account.{" "}
        <Link href={link(site, "/forgot-password")} style={{ color: theme.accent }} className="sc-link">
          Reset your password
        </Link>{" "}
        now.
      </Notice>
    </EmailLayout>
  );
}

UsernameChanged.PreviewProps = {
  site: previewSite,
  name: "Ada",
  previous: "ada",
  username: "ada-lovelace",
  holdDays: 30,
  when: new Date("2026-09-28T07:15:00Z"),
} satisfies UsernameChangedProps;
