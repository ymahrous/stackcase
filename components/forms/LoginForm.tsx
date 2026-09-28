"use client";

import { useActionState } from "react";
import { logIn } from "@/app/(auth)/actions";
import { idleState } from "@/lib/action-state";
import { FormMessage } from "./FormMessage";
import { TextField } from "./Field";
import { SubmitButton } from "./SubmitButton";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(logIn, idleState);
  return (
    <form action={action} className="ui-form">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={next ?? ""} />
      <TextField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
      />
      <TextField name="password" type="password" label="Password" autoComplete="current-password" required />
      <SubmitButton className="btn primary block" pendingLabel="Logging in…">
        Log in
      </SubmitButton>
    </form>
  );
}
