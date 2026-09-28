"use client";

import { useState } from "react";
import { useUsernameCheck } from "@/lib/hooks/useUsernameCheck";

interface UsernameFieldProps {
  defaultValue?: string;
  /** The signed-in user's current username, when renaming. */
  current?: string;
  /** Server-side error from the last submission. */
  error?: string;
  /** Address shown before the input, e.g. "stackcase.vercel.app/". */
  prefix: string;
  label?: string;
}

/** Username input that shows the resulting address and checks availability as you type. */
export function UsernameField({
  defaultValue = "",
  current,
  error,
  prefix,
  label = "Username",
}: UsernameFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const check = useUsernameCheck(value, current);
  const showServerError = error && value === defaultValue;

  let status: React.ReactNode = null;
  if (check.state === "checking") status = <span className="ui-hint">Checking…</span>;
  else if (check.state === "available") status = <span className="ui-ok">✓ {check.message}</span>;
  else if (check.state === "error") status = <span className="ui-hint">{check.message}</span>;
  else if (check.state === "unavailable") {
    status = (
      <span className="ui-error">
        {check.message}
        {check.suggestions.length ? (
          <>
            {" "}
            Try{" "}
            {check.suggestions.map((s, i) => (
              <span key={s}>
                {i > 0 ? ", " : ""}
                <button type="button" className="ui-linkbtn" onClick={() => setValue(s)}>
                  {s}
                </button>
              </span>
            ))}
            .
          </>
        ) : null}
      </span>
    );
  }

  return (
    <div className="ui-field">
      <label htmlFor="f-username">{label}</label>
      <div className="ui-affix">
        <span aria-hidden="true">{prefix}</span>
        <input
          id="f-username"
          name="username"
          value={value}
          onChange={(e) => setValue(e.target.value.toLowerCase().replace(/\s/g, "-"))}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={30}
          required
          aria-invalid={showServerError || check.state === "unavailable" ? true : undefined}
          aria-describedby="f-username-status"
        />
      </div>
      <div id="f-username-status" aria-live="polite">
        {showServerError ? <span className="ui-error">{error}</span> : status}
      </div>
    </div>
  );
}
