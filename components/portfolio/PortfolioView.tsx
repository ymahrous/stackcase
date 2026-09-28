import { type ElementType, Fragment } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ExternalLink } from "@/components/ExternalLink";
import {
  CodeIcon,
  ExternalIcon,
  FileIcon,
  GitHubIcon,
  GlobeIcon,
  LinkedInIcon,
  MailIcon,
} from "@/components/Icons";
import { type PortfolioData, type ProjectData, designAttributes } from "@/lib/portfolio/types";
import { technologies } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { availabilityLabels } from "@/lib/validation";

/** Links the owner controls. `me` marks profile links as theirs; `nofollow ugc` because they are user-supplied. */
const PROFILE_REL = "me nofollow ugc";
const PROJECT_REL = "nofollow ugc";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? `${parts[0]![0]}${parts[parts.length - 1]![0]}` : (parts[0]?.slice(0, 2) ?? "?");
  return letters.toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

interface ViewProps {
  portfolio: PortfolioData;
  /** Embedded previews (landing page) render headings as plain text and drop landmarks. */
  embedded?: boolean;
  /** Rendered inside another page's <main> (dashboard preview): keep headings, drop landmarks. */
  nested?: boolean;
  year?: number;
}

function PrimaryContact({ p }: { p: PortfolioData }) {
  if (p.linkedinUrl) {
    return (
      <ExternalLink className="btn primary" href={p.linkedinUrl} rel={PROFILE_REL}>
        <LinkedInIcon />
        Message on LinkedIn
      </ExternalLink>
    );
  }
  if (p.contactEmail) {
    return (
      <a className="btn primary" href={`mailto:${p.contactEmail}`}>
        <MailIcon />
        Email {firstName(p.displayName)}
      </a>
    );
  }
  if (p.websiteUrl) {
    return (
      <ExternalLink className="btn primary" href={p.websiteUrl} rel={PROFILE_REL}>
        <GlobeIcon />
        Visit website
      </ExternalLink>
    );
  }
  return null;
}

function SecondaryLinks({ p }: { p: PortfolioData }) {
  return (
    <>
      {p.githubUrl ? (
        <ExternalLink className="btn" href={p.githubUrl} rel={PROFILE_REL}>
          <GitHubIcon />
          GitHub
        </ExternalLink>
      ) : null}
      {p.linkedinUrl && p.contactEmail ? (
        <a className="btn" href={`mailto:${p.contactEmail}`}>
          <MailIcon />
          Email
        </a>
      ) : null}
      {p.websiteUrl && (p.linkedinUrl || p.contactEmail) ? (
        <ExternalLink className="btn" href={p.websiteUrl} rel={PROFILE_REL}>
          <GlobeIcon />
          Website
        </ExternalLink>
      ) : null}
      {p.resumeUrl ? (
        <ExternalLink className="btn" href={p.resumeUrl} rel={PROJECT_REL}>
          <FileIcon />
          Résumé
        </ExternalLink>
      ) : null}
    </>
  );
}

function ProjectCase({
  project,
  index,
  H3,
  H4,
}: {
  project: ProjectData;
  index: number;
  H3: ElementType;
  H4: ElementType;
}) {
  const headingId = `project-${index + 1}-title`;
  return (
    <article className="proj" id={`project-${index + 1}`} aria-labelledby={headingId}>
      <aside className="meta">
        {project.label ? <span className="kind">{project.label}</span> : null}
        <H3 id={headingId}>{project.name}</H3>
        {project.tagline ? <p className="tag">{project.tagline}</p> : null}
        {project.stack.length ? (
          <ul className="chips" aria-label={`${project.name} tech stack`}>
            {project.stack.map((tech) => (
              <li key={tech} className="chip">
                {tech}
              </li>
            ))}
          </ul>
        ) : null}
        {project.liveUrl || project.sourceUrl ? (
          <div className="links">
            {project.liveUrl ? (
              <ExternalLink
                href={project.liveUrl}
                rel={PROJECT_REL}
                aria-label={`Open live app: ${project.name}`}
              >
                <ExternalIcon />
                Open live app
              </ExternalLink>
            ) : null}
            {project.sourceUrl ? (
              <ExternalLink
                href={project.sourceUrl}
                rel={PROJECT_REL}
                aria-label={`View source: ${project.name}`}
              >
                <CodeIcon />
                View source
              </ExternalLink>
            ) : null}
          </div>
        ) : null}
      </aside>
      <div className="body">
        {project.summary ? <p className="summary">{project.summary}</p> : null}
        {project.highlights.length ? (
          <div className="cols">
            <div>
              <H4 className="pf-h4">Highlights</H4>
              <ul>
                {project.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PortfolioView({
  portfolio: p,
  embedded = false,
  nested = false,
  year = new Date().getFullYear(),
}: ViewProps) {
  const H1: ElementType = embedded ? "div" : "h1";
  const H2: ElementType = embedded ? "div" : "h2";
  const H3: ElementType = embedded ? "div" : "h3";
  const landmarks = !embedded && !nested;
  const Header: ElementType = landmarks ? "header" : "div";
  const Main: ElementType = landmarks ? "main" : "div";
  const Footer: ElementType = landmarks ? "footer" : "div";
  const stack = technologies(p).slice(0, 10);
  const hasContact = Boolean(p.linkedinUrl || p.contactEmail || p.websiteUrl || p.resumeUrl);
  const sectionOrder =
    p.sectionOrder === "SKILLS_FIRST" ? (["skills", "projects"] as const) : (["projects", "skills"] as const);
  const ref = new URL(absoluteUrl("/"));
  ref.searchParams.set("ref", p.username);

  return (
    <div className="pf" {...designAttributes(p)}>
      <Header className="hero" id={landmarks ? "top" : undefined}>
        <div className="wrap">
          <div>
            <p className={`status status-${p.availability.toLowerCase()}`}>
              <i aria-hidden="true" />
              {availabilityLabels[p.availability]}
              {p.location ? ` · ${p.location}` : ""}
            </p>
            <H1 className="pf-name">{p.displayName}</H1>
            {p.pronouns ? (
              <p className="pf-pronouns">
                <span className="sr-only">Pronouns: </span>
                {p.pronouns}
              </p>
            ) : null}
            {p.headline ? <p className="pf-headline">{p.headline}</p> : null}
            {p.bio ? <p className="lede">{p.bio}</p> : null}
            <div className="ctas">
              {p.projects.length ? (
                <a className="btn" href="#work">
                  See projects
                </a>
              ) : null}
              <PrimaryContact p={p} />
              <SecondaryLinks p={p} />
            </div>
          </div>
          {p.showGlance && (stack.length || p.projects.length) ? (
            <aside className="pf-glance" aria-label="At a glance">
              <div className="monogram" aria-hidden="true">
                {initials(p.displayName)}
              </div>
              <dl>
                <div>
                  <dt className="label">Projects</dt>
                  <dd>{p.projects.length}</dd>
                </div>
                {p.location ? (
                  <div>
                    <dt className="label">Based in</dt>
                    <dd>{p.location}</dd>
                  </div>
                ) : null}
              </dl>
              {stack.length ? (
                <>
                  <span className="label">Works with</span>
                  <ul className="chips" aria-label="Technologies">
                    {stack.map((t) => (
                      <li key={t} className="chip">
                        {t}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </aside>
          ) : null}
        </div>
      </Header>

      <Main className="wrap" id={landmarks ? "main" : undefined}>
        {sectionOrder.map((section) =>
          section === "projects" ? (
            <Fragment key="projects">
              {p.projects.length ? (
                <section className="block" id="work" aria-labelledby="work-h">
                  <div className="sec-head">
                    <div>
                      <span className="label">Selected work</span>
                      <H2 id="work-h">Projects</H2>
                    </div>
                  </div>
                  <div className="proj-list">
                    {p.projects.map((project, i) => (
                      <ProjectCase
                        key={project.id}
                        project={project}
                        index={i}
                        H3={H3}
                        H4={embedded ? "div" : "h4"}
                      />
                    ))}
                  </div>
                </section>
              ) : embedded ? (
                <p className="pf-empty">No projects yet. Add one from the Projects tab.</p>
              ) : null}
            </Fragment>
          ) : (
            <Fragment key="skills">
              {p.showSkills && p.skills.length ? (
                <section className="block" id="skills" aria-labelledby="skills-h">
                  <div className="sec-head">
                    <div>
                      <span className="label">Skills</span>
                      <H2 id="skills-h">What I work with</H2>
                    </div>
                  </div>
                  <div
                    className="skills"
                    role="region"
                    aria-label="Skills table, scrollable"
                    tabIndex={embedded ? -1 : 0}
                  >
                    <table>
                      <caption className="sr-only">Skills by area</caption>
                      <thead>
                        <tr>
                          <th scope="col">Area</th>
                          <th scope="col">Tools</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.skills.map((s) => (
                          <tr key={s.id}>
                            <th scope="row">{s.area}</th>
                            <td>{s.tools}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}
            </Fragment>
          ),
        )}

        {p.showContact && hasContact ? (
          <section id="contact" aria-labelledby="contact-h">
            <div className="contact">
              <div>
                <H2 id="contact-h">Want to work with {firstName(p.displayName)}?</H2>
                <p>{availabilityLabels[p.availability]}.</p>
              </div>
              <div className="ctas">
                <PrimaryContact p={p} />
                <SecondaryLinks p={p} />
              </div>
            </div>
          </section>
        ) : null}
      </Main>

      <Footer className="wrap pf-footer">
        <span>
          © {year} {p.displayName}
        </span>
        <a className="pf-badge" href={ref.toString()}>
          <LogoMark size={20} />
          Made with {siteConfig.name}
        </a>
        <span className="pf-legal">
          <a href={absoluteUrl("/privacy")}>Privacy</a>
          <a href={absoluteUrl("/terms")}>Terms</a>
          <a href={absoluteUrl("/accessibility")}>Accessibility</a>
        </span>
      </Footer>
    </div>
  );
}
