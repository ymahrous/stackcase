"use client";

import { useActionState } from "react";
import { changePassword, deleteAccount, updateUsername } from "@/app/dashboard/actions";
import { TextField } from "@/components/forms/Field";
import { FormMessage } from "@/components/forms/FormMessage";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { UsernameField } from "@/components/forms/UsernameField";
import { idleState } from "@/lib/action-state";

export function UsernameForm({
  username,
  prefix,
  nextChangeLabel,
}: {
  username: string;
  prefix: string;
  nextChangeLabel: string | null;
}) {
  const [state, action] = useActionState(updateUsername, idleState);
  const typed = state.status === "error" ? state.values?.username : undefined;
  return (
    <form action={action} className="ui-form" noValidate>
      <UsernameField
        key={`${username}-${typed ?? ""}`}
        prefix={prefix}
        current={username}
        defaultValue={typed ?? username}
        error={state.fieldErrors?.username}
      />
      {nextChangeLabel ? <p className="ui-hint">You can change it again on {nextChangeLabel}.</p> : null}
      <div className="ui-actions">
        <SubmitButton pendingLabel="Changing…" disabled={Boolean(nextChangeLabel)}>
          Change username
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, idleState);
  return (
    <form
      action={action}
      className="ui-form"
      noValidate
      key={state.status === "success" ? state.message : "pw"}
    >
      <input type="text" name="username" autoComplete="username" hidden readOnly />
      <div className="ui-row">
        <TextField
          name="current"
          type="password"
          label="Current password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.current}
        />
        <TextField
          name="next"
          type="password"
          label="New password"
          autoComplete="new-password"
          required
          minLength={10}
          hint="At least 10 characters."
          error={state.fieldErrors?.next}
        />
      </div>
      <div className="ui-actions">
        <SubmitButton pendingLabel="Updating…">Change password</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}

export function DeleteAccountForm({ username }: { username: string }) {
  const [state, action] = useActionState(deleteAccount, idleState);
  return (
    <form action={action} className="ui-form" noValidate>
      <div className="ui-row">
        <TextField
          id="f-confirm"
          name="confirm"
          label={`Type ${username} to confirm`}
          autoComplete="off"
          autoCapitalize="none"
          required
          error={state.fieldErrors?.confirm}
        />
        <TextField
          id="f-delete-password"
          name="password"
          type="password"
          label="Password"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
      </div>
      <div className="ui-actions">
        <SubmitButton className="btn danger" pendingLabel="Deleting…">
          Delete account and portfolio
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
