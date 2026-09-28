import { DesignForm } from "@/components/dashboard/DesignForm";
import { requireUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/queries";

export const metadata = { title: "Design" };

export default async function DesignPage() {
  const user = await requireUser("/dashboard/design");
  const p = (await getPortfolioForUser(user.id))!;
  const design = {
    accent: p.accent,
    colorMode: p.colorMode,
    fontStyle: p.fontStyle,
    layout: p.layout,
    sectionOrder: p.sectionOrder,
    showGlance: p.showGlance,
    showSkills: p.showSkills,
    showContact: p.showContact,
  };
  return (
    <>
      <div className="ui-page-head">
        <div>
          <h1>Design</h1>
          <p>
            Colors, typography, layout and sections. The preview updates as you choose; save to publish the
            look.
          </p>
        </div>
      </div>
      <DesignForm design={design} name={p.displayName} headline={p.headline} />
    </>
  );
}
