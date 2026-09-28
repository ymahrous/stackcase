"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveSkill } from "@/app/dashboard/actions";
import { TextField } from "@/components/forms/Field";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { idleState } from "@/lib/action-state";
import type { SkillData } from "@/lib/portfolio/types";
import { limits } from "@/lib/validation";

export function SkillForm({ skill }: { skill?: SkillData }) {
  const [state, action] = useActionState(saveSkill, idleState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!skill && state.status === "success") formRef.current?.reset();
  }, [skill, state]);
  const e = state.fieldErrors ?? {};
  const idp = skill ? `s-${skill.id}-` : "s-new-";
  return (
    <form ref={formRef} action={action} className="ui-form" noValidate>
      {skill ? <input type="hidden" name="id" value={skill.id} /> : null}
      <div className="ui-row">
        <TextField
          id={`${idp}area`}
          name="area"
          label="Area"
          required
          maxLength={limits.skillArea}
          placeholder="Backend"
          defaultValue={state.values?.area ?? skill?.area ?? ""}
          error={e.area}
        />
        <TextField
          id={`${idp}tools`}
          name="tools"
          label="Tools"
          required
          maxLength={limits.skillTools}
          placeholder="Python, FastAPI, Postgres, Redis"
          defaultValue={state.values?.tools ?? skill?.tools ?? ""}
          error={e.tools}
        />
      </div>
      <div className="ui-actions">
        <SubmitButton pendingLabel="Saving…">{skill ? "Save" : "Add skill"}</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
