"use client";

import { useActionState, useEffect, useState } from "react";
import type { ActionState } from "@/app/(app)/actions";

// Wraps a server action with a pending state and a result message; inputs are passed as children.
export function ActionForm({
  action, submitLabel, pendingLabel = "Saving…", resetOnSuccess = false, children,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  submitLabel: string;
  pendingLabel?: string;
  resetOnSuccess?: boolean;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) setGeneration((g) => g + 1);
  }, [state, resetOnSuccess]);
  return (
    <form action={formAction} className="flex flex-col gap-3" key={generation}>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn" disabled={pending}>{pending ? pendingLabel : submitLabel}</button>
        {state && <span className={`text-[0.88rem] ${state.ok ? "text-good" : "text-bad"}`} role="status">{state.message}</span>}
      </div>
    </form>
  );
}
