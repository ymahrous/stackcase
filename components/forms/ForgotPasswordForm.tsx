"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/(auth)/actions";
import { idleState } from "@/lib/action-state";
import { FormMessage } from "./FormMessage";
import { TextField } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, idleState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="ui-form" noValidate>
      <FormMessage state={state} />
      <TextField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <SubmitButton className="btn primary block" pendingLabel="Sending…">
        Send reset link
      </SubmitButton>
    </form>
  );
}
