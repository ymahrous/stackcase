"use client";

import { useActionState } from "react";
import { setPublished } from "@/app/dashboard/actions";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { idleState } from "@/lib/action-state";

export function PublishForm({ published }: { published: boolean }) {
  const [state, action] = useActionState(setPublished, idleState);
  return (
    <form action={action} className="ui-form">
      <input type="hidden" name="publish" value={published ? "false" : "true"} />
      <div className="ui-actions">
        <SubmitButton
          className={published ? "btn" : "btn primary"}
          pendingLabel={published ? "Hiding…" : "Publishing…"}
        >
          {published ? "Unpublish" : "Publish portfolio"}
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
