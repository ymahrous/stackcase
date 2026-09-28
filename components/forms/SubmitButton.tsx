"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}

/** Disables itself and swaps its label while the parent form's action is running. */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn primary",
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
    >
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
