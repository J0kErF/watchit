"use client";

import { useActionState } from "react";
import { addHost, login } from "./actions";

const INPUT =
  "min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent";
const BUTTON =
  "rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60";

function Status({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state) return null;
  return (
    <p role="status" className={`mt-3 text-sm ${state.ok ? "text-accent" : "text-red-400"}`}>
      {state.message}
    </p>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="max-w-md">
      <label htmlFor="password" className="mb-2 block text-sm font-medium">
        Password
      </label>
      <div className="flex gap-3">
        <input id="password" name="password" type="password" required autoComplete="current-password" className={INPUT} />
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? "Checking…" : "Sign in"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}

export function AddHostForm() {
  const [state, action, pending] = useActionState(addHost, null);
  return (
    <form action={action} className="max-w-xl">
      <label htmlFor="host" className="mb-2 block text-sm font-medium">
        Add a domain
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="host"
          name="host"
          required
          placeholder="library.example.com or *.example.com"
          autoComplete="off"
          spellCheck={false}
          className={INPUT}
        />
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      <Status state={state} />
    </form>
  );
}
