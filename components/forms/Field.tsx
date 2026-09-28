import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface ShellProps {
  name: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  id?: string;
}

function ids(name: string, id: string | undefined, hint: ReactNode, error: string | undefined) {
  const controlId = id ?? `f-${name}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  return {
    controlId,
    hintId,
    errorId,
    aria: {
      "aria-invalid": error ? true : undefined,
      "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
    },
  };
}

function Shell({
  label,
  controlId,
  hint,
  hintId,
  error,
  errorId,
  children,
}: {
  label: string;
  controlId: string;
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="ui-field">
      <label htmlFor={controlId}>{label}</label>
      {children}
      {hint ? (
        <span className="ui-hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="ui-error" id={errorId}>
          {error}
        </span>
      ) : null}
    </div>
  );
}

type TextFieldProps = ShellProps & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id">;

/** Label, input, hint and error wired together so screen readers announce all three. */
export function TextField({ name, label, hint, error, id, ...input }: TextFieldProps) {
  const { controlId, hintId, errorId, aria } = ids(name, id, hint, error);
  return (
    <Shell label={label} controlId={controlId} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <input className="ui-input" id={controlId} name={name} {...aria} {...input} />
    </Shell>
  );
}

type TextAreaFieldProps = ShellProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id">;

export function TextAreaField({ name, label, hint, error, id, ...textarea }: TextAreaFieldProps) {
  const { controlId, hintId, errorId, aria } = ids(name, id, hint, error);
  return (
    <Shell label={label} controlId={controlId} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <textarea className="ui-textarea" id={controlId} name={name} {...aria} {...textarea} />
    </Shell>
  );
}
