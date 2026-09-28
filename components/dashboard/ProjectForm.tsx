"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveProject } from "@/app/dashboard/actions";
import { TextAreaField, TextField } from "@/components/forms/Field";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { idleState } from "@/lib/action-state";
import type { ProjectData } from "@/lib/portfolio/types";
import { limits } from "@/lib/validation";

export function ProjectForm({ project }: { project?: ProjectData }) {
  const [state, action] = useActionState(saveProject, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  const isNew = !project;
  useEffect(() => {
    if (isNew && state.status === "success") formRef.current?.reset();
  }, [isNew, state]);
  const v = state.values;
  const e = state.fieldErrors ?? {};
  const val = (key: "name" | "label" | "tagline" | "summary" | "liveUrl" | "sourceUrl") =>
    v?.[key] ?? (project?.[key] as string | null | undefined) ?? "";
  const idp = project ? `p-${project.id}-` : "p-new-";
  return (
    <form ref={formRef} action={action} className="ui-form" noValidate>
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <div className="ui-row">
        <TextField
          id={`${idp}name`}
          name="name"
          label="Project name"
          required
          maxLength={limits.projectName}
          defaultValue={val("name")}
          error={e.name}
        />
        <TextField
          id={`${idp}label`}
          name="label"
          label="Label"
          maxLength={limits.projectLabel}
          placeholder="Live SaaS · Open source · Hackathon"
          defaultValue={val("label")}
          error={e.label}
        />
      </div>
      <TextField
        id={`${idp}tagline`}
        name="tagline"
        label="One-liner"
        maxLength={limits.tagline}
        placeholder="What it is, in one sentence."
        defaultValue={val("tagline")}
        error={e.tagline}
      />
      <TextAreaField
        id={`${idp}summary`}
        name="summary"
        label="Summary"
        rows={3}
        maxLength={limits.summary}
        placeholder="The problem, what you built, and the result."
        defaultValue={val("summary")}
        error={e.summary}
      />
      <TextField
        id={`${idp}stack`}
        name="stack"
        label="Tech stack"
        placeholder="Next.js, TypeScript, Postgres"
        hint="Separate with commas."
        defaultValue={v?.stack ?? project?.stack.join(", ") ?? ""}
        error={e.stack}
      />
      <TextAreaField
        id={`${idp}highlights`}
        name="highlights"
        label="Highlights"
        rows={4}
        placeholder={"One per line, e.g.\nCut p95 latency from 900ms to 120ms with a Redis cache"}
        hint={`Up to ${limits.highlights}. Numbers and decisions beat adjectives.`}
        defaultValue={v?.highlights ?? project?.highlights.join("\n") ?? ""}
        error={e.highlights}
      />
      <div className="ui-row">
        <TextField
          id={`${idp}liveUrl`}
          name="liveUrl"
          label="Live URL"
          inputMode="url"
          placeholder="Optional"
          defaultValue={val("liveUrl")}
          error={e.liveUrl}
        />
        <TextField
          id={`${idp}sourceUrl`}
          name="sourceUrl"
          label="Source code URL"
          inputMode="url"
          placeholder="github.com/you/project"
          defaultValue={val("sourceUrl")}
          error={e.sourceUrl}
        />
      </div>
      <div className="ui-actions">
        <SubmitButton pendingLabel="Saving…">{isNew ? "Add project" : "Save project"}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
