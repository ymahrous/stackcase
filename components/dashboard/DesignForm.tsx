"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetDesign, updateDesign } from "@/app/dashboard/actions";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { idleState } from "@/lib/action-state";
import { type DesignData, designAttributes } from "@/lib/portfolio/types";
import {
  ACCENTS,
  COLOR_MODES,
  FONT_STYLES,
  LAYOUTS,
  SECTION_ORDERS,
  accentLabels,
  colorModeLabels,
  fontStyleLabels,
  layoutLabels,
  sectionOrderLabels,
} from "@/lib/validation";

interface Props {
  design: DesignData;
  name: string;
  headline: string;
}

/** One-line description of the current design, announced to screen readers as it changes. */
export function describeDesign(d: DesignData): string {
  const sections = [
    d.showGlance && "summary card",
    d.showSkills && "skills",
    d.showContact && "contact",
  ].filter(Boolean);
  return [
    `${accentLabels[d.accent]} accent`,
    colorModeLabels[d.colorMode].label.toLowerCase(),
    `${fontStyleLabels[d.fontStyle].label.toLowerCase()} headings`,
    layoutLabels[d.layout].label.toLowerCase(),
    sections.length ? `showing ${sections.join(", ")}` : "projects only",
  ].join(", ");
}

export function DesignForm({ design, name, headline }: Props) {
  const [state, action] = useActionState(updateDesign, idleState);
  const [resetState, resetAction] = useActionState(resetDesign, idleState);
  const [d, setD] = useState<DesignData>(design);
  const set = <K extends keyof DesignData>(key: K, value: DesignData[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));
  const e = state.fieldErrors ?? {};

  return (
    <div className="ui-design">
      <form action={action} className="ui-form" noValidate aria-describedby="design-summary">
        <fieldset className="ui-card">
          <legend className="ui-card-legend">Color</legend>
          <p>The accent colors links, buttons and your headline. Every option meets WCAG AA contrast.</p>
          <div className="ui-swatches" role="radiogroup" aria-label="Accent color">
            {ACCENTS.map((a) => (
              <label key={a} data-accent={a}>
                <input
                  type="radio"
                  name="accent"
                  value={a}
                  checked={d.accent === a}
                  onChange={() => set("accent", a)}
                />
                <i aria-hidden="true" />
                {accentLabels[a]}
              </label>
            ))}
          </div>
          {e.accent ? <p className="ui-error">{e.accent}</p> : null}
          <div className="ui-choices" role="radiogroup" aria-label="Color mode">
            {COLOR_MODES.map((m) => (
              <label key={m}>
                <input
                  type="radio"
                  name="colorMode"
                  value={m}
                  checked={d.colorMode === m}
                  onChange={() => set("colorMode", m)}
                />
                <span className={`ui-choice-art mode-${m.toLowerCase()}`} aria-hidden="true" />
                <b>{colorModeLabels[m].label}</b>
                <small>{colorModeLabels[m].hint}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="ui-card">
          <legend className="ui-card-legend">Headings</legend>
          <p>Body text stays easy to read; this changes your name, headline and section titles.</p>
          <div className="ui-choices" role="radiogroup" aria-label="Heading font">
            {FONT_STYLES.map((f) => (
              <label key={f}>
                <input
                  type="radio"
                  name="fontStyle"
                  value={f}
                  checked={d.fontStyle === f}
                  onChange={() => set("fontStyle", f)}
                />
                <span className="ui-choice-font" data-font={f.toLowerCase()} aria-hidden="true">
                  Aa
                </span>
                <b>{fontStyleLabels[f].label}</b>
                <small>{fontStyleLabels[f].hint}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="ui-card">
          <legend className="ui-card-legend">Project layout</legend>
          <div className="ui-choices" role="radiogroup" aria-label="Project layout">
            {LAYOUTS.map((l) => (
              <label key={l}>
                <input
                  type="radio"
                  name="layout"
                  value={l}
                  checked={d.layout === l}
                  onChange={() => set("layout", l)}
                />
                <span
                  className={`ui-choice-art layout-${l.toLowerCase().replace("_", "-")}`}
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                </span>
                <b>{layoutLabels[l].label}</b>
                <small>{layoutLabels[l].hint}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="ui-card">
          <legend className="ui-card-legend">Sections</legend>
          <p>Projects always show. Choose what else appears, and in what order.</p>
          <div className="ui-checks">
            <label className="ui-check">
              <input
                type="checkbox"
                name="showGlance"
                checked={d.showGlance}
                onChange={(ev) => set("showGlance", ev.target.checked)}
              />
              <span>&ldquo;At a glance&rdquo; card next to your intro</span>
            </label>
            <label className="ui-check">
              <input
                type="checkbox"
                name="showSkills"
                checked={d.showSkills}
                onChange={(ev) => set("showSkills", ev.target.checked)}
              />
              <span>Skills table</span>
            </label>
            <label className="ui-check">
              <input
                type="checkbox"
                name="showContact"
                checked={d.showContact}
                onChange={(ev) => set("showContact", ev.target.checked)}
              />
              <span>Closing &ldquo;Work with me&rdquo; section</span>
            </label>
          </div>
          <div className="ui-field">
            <label htmlFor="f-sectionOrder">Order</label>
            <select
              id="f-sectionOrder"
              name="sectionOrder"
              className="ui-select"
              value={d.sectionOrder}
              onChange={(ev) => set("sectionOrder", ev.target.value as DesignData["sectionOrder"])}
              disabled={!d.showSkills}
              aria-describedby="f-sectionOrder-hint"
            >
              {SECTION_ORDERS.map((o) => (
                <option key={o} value={o}>
                  {sectionOrderLabels[o]}
                </option>
              ))}
            </select>
            {/* A disabled select isn't submitted; keep the value. */}
            {!d.showSkills ? <input type="hidden" name="sectionOrder" value={d.sectionOrder} /> : null}
            <span className="ui-hint" id="f-sectionOrder-hint">
              Lead with skills if you&apos;re changing fields and your projects are older.
            </span>
          </div>
        </fieldset>

        <div className="ui-actions">
          <SubmitButton pendingLabel="Saving…">Save design</SubmitButton>
          <Link className="btn ghost" href="/dashboard/preview">
            Full preview
          </Link>
        </div>
        <FormMessage state={state} />
      </form>

      <aside className="ui-design-side" aria-label="Live preview">
        <span className="label">Live preview</span>
        <p id="design-summary" className="sr-only" aria-live="polite">
          {`Preview: ${describeDesign(d)}.`}
        </p>
        <DesignPreview design={d} name={name} headline={headline} />
        <form action={resetAction} className="ui-design-reset">
          <SubmitButton className="btn sm ghost" pendingLabel="Resetting…">
            Reset to defaults
          </SubmitButton>
          <FormMessage state={resetState} />
        </form>
      </aside>
    </div>
  );
}

/** A miniature portfolio that reacts to every choice before it's saved. Decorative: described in text above. */
export function DesignPreview({ design: d, name, headline }: Props) {
  const skills = d.showSkills ? (
    <div className="dp-skills" key="skills">
      <span className="dp-label">Skills</span>
      <div className="dp-row" />
      <div className="dp-row short" />
    </div>
  ) : null;
  const projects = (
    <div className="dp-projects" key="projects">
      <span className="dp-label">Projects</span>
      <div className="dp-grid">
        {[1, 2, 3].map((n) => (
          <div className="dp-proj" key={n}>
            <b>Project {n}</b>
            <div className="dp-row" />
            <div className="dp-row short" />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="pf dp" aria-hidden="true" {...designAttributes(d)}>
      <div className="dp-hero">
        <div>
          <span className="dp-status">Open to new roles</span>
          <div className="dp-name">{name || "Your name"}</div>
          <div className="dp-headline">{headline || "Your headline"}</div>
          <span className="dp-btn">Message on LinkedIn</span>
        </div>
        {d.showGlance ? <div className="dp-glance" /> : null}
      </div>
      {d.sectionOrder === "SKILLS_FIRST" ? [skills, projects] : [projects, skills]}
      {d.showContact ? <div className="dp-contact">Want to work with me?</div> : null}
    </div>
  );
}
