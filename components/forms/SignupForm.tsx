"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/app/(auth)/actions";
import { idleState } from "@/lib/action-state";
import { MINIMUM_AGE } from "@/lib/legal";
import { FormMessage } from "./FormMessage";
import { TextField } from "./Field";
import { SubmitButton } from "./SubmitButton";
import { UsernameField } from "./UsernameField";

export function SignupForm({ prefix, username = "" }: { prefix: string; username?: string }) {
  const [state, action] = useActionState(signUp, idleState);
  const values = state.values ?? {};
  return (
    <form action={action} className="ui-form" noValidate>
      <FormMessage state={state} />
      <UsernameField
        key={values.username ?? username}
        prefix={prefix}
        defaultValue={values.username ?? username}
        error={state.fieldErrors?.username}
        label="Your address"
      />
      <TextField
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        defaultValue={values.email}
        error={state.fieldErrors?.email}
      />
      <TextField
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="At least 10 characters. A short phrase works well."
        error={state.fieldErrors?.password}
      />
      <div className="ui-check">
        <input
          type="checkbox"
          id="f-accept"
          name="accept"
          value="yes"
          required
          defaultChecked={values.accept === "yes"}
          aria-invalid={state.fieldErrors?.accept ? true : undefined}
          aria-describedby={state.fieldErrors?.accept ? "f-accept-error" : undefined}
        />
        <label htmlFor="f-accept">
          I&apos;m at least {MINIMUM_AGE}, I agree to the{" "}
          <Link href="/terms" target="_blank">
            Terms of Service
          </Link>
          , and I&apos;ve read the{" "}
          <Link href="/privacy" target="_blank">
            Privacy Policy
          </Link>
          .
        </label>
      </div>
      {state.fieldErrors?.accept ? (
        <span className="ui-error" id="f-accept-error">
          {state.fieldErrors.accept}
        </span>
      ) : null}
      <SubmitButton className="btn primary block" pendingLabel="Creating your portfolio…">
        Create my portfolio
      </SubmitButton>
      <p className="ui-hint">
        Free. Your portfolio stays private until you publish it. Already have an account?{" "}
        <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
