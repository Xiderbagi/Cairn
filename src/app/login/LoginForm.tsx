"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(sendMagicLink, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      <label className="field" htmlFor="email">
        Email
        <input id="email" name="email" type="email" required autoComplete="email" />
      </label>
      <button className="btn" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</button>
      {state && <p className={`text-[0.88rem] ${state.ok ? "text-good" : "text-bad"}`}>{state.message}</p>}
    </form>
  );
}
