import type { ActionState } from "@/lib/action-state";

/** Form-level result, announced to screen readers. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) return <div role="status" aria-live="polite" />;
  return (
    <div
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`ui-msg ${state.status}`}
    >
      {state.message}
    </div>
  );
}
