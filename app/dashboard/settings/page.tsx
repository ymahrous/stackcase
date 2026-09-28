import Link from "next/link";
import { DeleteAccountForm, PasswordForm, UsernameForm } from "@/components/dashboard/SettingsForms";
import { nextUsernameChangeAt } from "@/lib/account";
import { requireUser } from "@/lib/auth/session";
import { siteConfig } from "@/lib/site";
import { USERNAME_CHANGE_COOLDOWN_DAYS, USERNAME_HOLD_DAYS } from "@/lib/username";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const next = nextUsernameChangeAt(user.usernameChangedAt);
  const nextLabel =
    next && next > new Date()
      ? next.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : null;
  return (
    <>
      <div className="ui-page-head">
        <div>
          <h1>Settings</h1>
          <p>
            Signed in as {user.email}
            {user.emailVerifiedAt ? " (confirmed)." : " (not confirmed yet)."}
          </p>
        </div>
      </div>
      <section className="ui-card" aria-labelledby="username-h">
        <h2 id="username-h">Username</h2>
        <p>
          Your username is the last part of your portfolio link. When you change it, the old link redirects to
          the new one for {USERNAME_HOLD_DAYS} days and nobody else can take it. You can change it once every{" "}
          {USERNAME_CHANGE_COOLDOWN_DAYS} days.
        </p>
        <UsernameForm username={user.username} prefix={`${siteConfig.host}/`} nextChangeLabel={nextLabel} />
      </section>
      <section className="ui-card" aria-labelledby="password-h">
        <h2 id="password-h">Password</h2>
        <p>Changing your password signs you out on every other device and sends you an email notice.</p>
        <PasswordForm />
      </section>
      <section className="ui-card" aria-labelledby="data-h">
        <h2 id="data-h">Your data</h2>
        <p>
          Download everything we hold about you as a JSON file: account details, your portfolio, projects,
          skills, previous usernames and active sessions. See the <Link href="/privacy">Privacy Policy</Link>{" "}
          for how we use it.
        </p>
        <a className="btn" href="/dashboard/export" download>
          Download your data
        </a>
      </section>
      <section className="ui-card danger-zone" aria-labelledby="delete-h">
        <h2 id="delete-h">Delete account</h2>
        <p>Deletes your account, portfolio and all content immediately. This can&apos;t be undone.</p>
        <DeleteAccountForm username={user.username} />
      </section>
    </>
  );
}
