import { SkillForm } from "@/components/dashboard/SkillForm";
import { requireUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/queries";
import { limits } from "@/lib/validation";
import { deleteSkill, moveSkill } from "../actions";

export const metadata = { title: "Skills" };

export default async function SkillsPage() {
  const user = await requireUser("/dashboard/skills");
  const { skills } = (await getPortfolioForUser(user.id))!;
  return (
    <>
      <div className="ui-page-head">
        <div>
          <h1>Skills</h1>
          <p>Group tools by area, e.g. Frontend, Backend, Cloud. Keep it to what your projects show.</p>
        </div>
      </div>
      <div className="ui-list">
        {skills.map((skill, i) => (
          <details className="ui-item" key={skill.id}>
            <summary>
              <strong>{skill.area}</strong>
              <span>{skill.tools}</span>
              <em>Edit</em>
            </summary>
            <div className="ui-item-body">
              <SkillForm skill={skill} />
            </div>
            <div className="ui-item-tools">
              <form action={moveSkill}>
                <input type="hidden" name="id" value={skill.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  className="btn sm"
                  type="submit"
                  disabled={i === 0}
                  aria-label={`Move ${skill.area} up`}
                >
                  ↑ Move up
                </button>
              </form>
              <form action={moveSkill}>
                <input type="hidden" name="id" value={skill.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  className="btn sm"
                  type="submit"
                  disabled={i === skills.length - 1}
                  aria-label={`Move ${skill.area} down`}
                >
                  ↓ Move down
                </button>
              </form>
              <form action={deleteSkill}>
                <input type="hidden" name="id" value={skill.id} />
                <button className="btn sm ghost" type="submit" aria-label={`Delete ${skill.area}`}>
                  Delete
                </button>
              </form>
            </div>
          </details>
        ))}
        {skills.length < limits.skills ? (
          <details className="ui-item" open={skills.length === 0}>
            <summary>
              <strong>Add a skill area</strong>
              <em>+ New</em>
            </summary>
            <div className="ui-item-body">
              <SkillForm />
            </div>
          </details>
        ) : null}
      </div>
    </>
  );
}
