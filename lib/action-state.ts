/** Shape returned by every form Server Action, consumed by useActionState. */
export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Submitted values echoed back so fields keep their contents after a validation error. */
  values?: Record<string, string>;
}

export const idleState: ActionState = { status: "idle" };

export function errorState(
  message: string,
  fieldErrors?: Record<string, string>,
  values?: Record<string, string>,
): ActionState {
  return { status: "error", message, fieldErrors, values };
}

export function successState(message: string): ActionState {
  return { status: "success", message };
}
