import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { requireUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/queries";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const portfolio = (await getPortfolioForUser(user.id))!;
  return (
    <>
      <div className="ui-page-head">
        <div>
          <h1>Profile</h1>
          <p>Name, role, intro and links. Changes go live as soon as you save.</p>
        </div>
      </div>
      <ProfileForm portfolio={portfolio} />
    </>
  );
}
