"use client";

import { useActionState } from "react";
import { confirmEmail } from "@/app/(auth)/actions";
import { idleState } from "@/lib/action-state";
import { FormMessage } from "./FormMessage";
import { SubmitButton } from "./SubmitButton";

/**
 * Confirmation happens on a button press, not on page load: email security scanners open links
 * automatically, and a GET that changes state would be triggered by them.
 */
export function ConfirmEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(confirmEmail, idleState);
  return (
    <form action={action} className="ui-form">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton className="btn primary block" pendingLabel="Confirming…">
        Confirm my email
      </SubmitButton>
    </form>
  );
}
