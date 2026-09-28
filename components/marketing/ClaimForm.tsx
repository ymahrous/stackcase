"use client";

import { useId, useState } from "react";
import { useUsernameCheck } from "@/lib/hooks/useUsernameCheck";

interface ClaimFormProps {
  /** Address shown before the input, e.g. "stackcase.vercel.app/". */
  prefix: string;
  cta?: string;
}

/**
 * The hero's primary conversion point: type a name, see if it's free, continue to sign-up with it prefilled.
 * A plain GET form, so it still works before JavaScript loads.
 */
export function ClaimForm({ prefix, cta = "Claim it" }: ClaimFormProps) {
  const id = useId();
  const [value, setValue] = useState("");
  const check = useUsernameCheck(value);

  let status: React.ReactNode = <span className="ui-hint">Lowercase letters, numbers and hyphens.</span>;
  if (check.state === "checking") status = "Checking…";
  else if (check.state === "available") status = `✓ ${prefix}${check.username} is available`;
  else if (check.state === "error") status = check.message;
  else if (check.state === "unavailable") {
    status = (
      <>
        {check.message}
        {check.suggestions.length ? (
          <>
            {" "}
            Try{" "}
            {check.suggestions.map((s, i) => (
              <span key={s}>
                {i > 0 ? ", " : ""}
                <button type="button" onClick={() => setValue(s)}>
                  {s}
                </button>
              </span>
            ))}
          </>
        ) : null}
      </>
    );
  }
  const tone = check.state === "available" ? "ok" : check.state === "unavailable" ? "bad" : "";

  return (
    <form className="claim" action="/signup" method="get">
      <div className="claim-row">
        <div className="claim-field">
          <span className="prefix" aria-hidden="true">
            {prefix}
          </span>
          <label htmlFor={id} className="sr-only">
            Username
          </label>
          <input
            id={id}
            name="username"
            placeholder="yourname"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s/g, "-"))}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={30}
            aria-describedby={`${id}-status`}
          />
        </div>
        <button type="submit" className="btn primary">
          {cta}
        </button>
      </div>
      <div id={`${id}-status`} className={`claim-status ${tone}`} aria-live="polite">
        {value ? status : <span className="ui-hint">Free · No credit card · Private until you publish</span>}
      </div>
    </form>
  );
}
