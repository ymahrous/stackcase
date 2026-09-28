"use client";

import { useActionState } from "react";
import { resendVerification } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { idleState } from "@/lib/action-state";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, action] = useActionState(resendVerification, idleState);
  return (
    <div className="ui-banner" role="region" aria-label="Confirm your email">
      <div className="wrap">
        <p>
          <b>Confirm your email.</b> We sent a link to {email}. It lets you reset your password if you forget
          it.
        </p>
        <form action={action}>
          <SubmitButton className="btn sm" pendingLabel="Sending…">
            Resend link
          </SubmitButton>
        </form>
        <span aria-live="polite" className={state.status === "error" ? "ui-error" : "ui-hint"}>
          {state.message}
        </span>
      </div>
    </div>
  );
}
