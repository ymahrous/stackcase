import { ProjectForm } from "@/components/dashboard/ProjectForm";
import { requireUser } from "@/lib/auth/session";
import { getPortfolioForUser } from "@/lib/portfolio/queries";
import { limits } from "@/lib/validation";
import { deleteProject, moveProject } from "../actions";

export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const user = await requireUser("/dashboard/projects");
  const { projects } = (await getPortfolioForUser(user.id))!;
  return (
    <>
      <div className="ui-page-head">
        <div>
          <h1>Projects</h1>
          <p>Lead with your strongest work. Recruiters rarely scroll past the third project.</p>
        </div>
      </div>
      <div className="ui-list">
        {projects.map((project, i) => (
          <details className="ui-item" key={project.id}>
            <summary>
              <strong>{project.name}</strong>
              <span>{project.tagline}</span>
              <em>Edit</em>
            </summary>
            <div className="ui-item-body">
              <ProjectForm project={project} />
            </div>
            <div className="ui-item-tools">
              <form action={moveProject}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="direction" value="up" />
                <button
                  className="btn sm"
                  type="submit"
                  disabled={i === 0}
                  aria-label={`Move ${project.name} up`}
                >
                  ↑ Move up
                </button>
              </form>
              <form action={moveProject}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="direction" value="down" />
                <button
                  className="btn sm"
                  type="submit"
                  disabled={i === projects.length - 1}
                  aria-label={`Move ${project.name} down`}
                >
                  ↓ Move down
                </button>
              </form>
              <form action={deleteProject}>
                <input type="hidden" name="id" value={project.id} />
                <button className="btn sm ghost" type="submit" aria-label={`Delete ${project.name}`}>
                  Delete
                </button>
              </form>
            </div>
          </details>
        ))}
        {projects.length < limits.projects ? (
          <details className="ui-item" open={projects.length === 0}>
            <summary>
              <strong>Add a project</strong>
              <em>+ New</em>
            </summary>
            <div className="ui-item-body">
              <ProjectForm />
            </div>
          </details>
        ) : null}
      </div>
    </>
  );
}
