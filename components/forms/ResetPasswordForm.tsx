"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/(auth)/actions";
import { idleState } from "@/lib/action-state";
import { FormMessage } from "./FormMessage";
import { TextField } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, idleState);
  return (
    <form action={action} className="ui-form" noValidate>
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <TextField
        name="password"
        type="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="At least 10 characters. A short phrase works well."
        error={state.fieldErrors?.password}
      />
      <SubmitButton className="btn primary block" pendingLabel="Saving…">
        Save new password
      </SubmitButton>
    </form>
  );
}
