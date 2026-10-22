"use client";

import { useActionState } from "react";
import { saveLibrary } from "./actions";

export function LibraryForm({ current, defaultHost }: { current: string; defaultHost: string }) {
  const [state, action, pending] = useActionState(saveLibrary, null);

  return (
    <form action={action} className="max-w-xl">
      <p className="mb-6 text-muted">
        Now playing from <span className="text-foreground">{current}</span>
        {current === defaultHost && " (default)"}.
      </p>
      <label htmlFor="domain" className="mb-2 block text-sm font-medium">
        Your library’s embed domain
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="domain"
          name="domain"
          required
          defaultValue={current === defaultHost ? "" : current}
          placeholder={defaultHost}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-accent-ink transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {current !== defaultHost && (
        <button
          type="submit"
          // Not name="reset": that would shadow form.reset(), which React calls after the action.
          name="intent"
          value="default"
          formNoValidate
          disabled={pending}
          className="mt-3 text-sm text-muted underline-offset-4 hover:text-foreground hover:underline"
        >
          Use the default library
        </button>
      )}
      {state && (
        <p role="status" className={`mt-4 text-sm ${state.ok ? "text-accent" : "text-red-400"}`}>
          {state.message}
        </p>
      )}
      <p className="mt-8 text-sm text-muted">
        Every title plays from this domain. Your embed provider needs this site on its safelist.
        The choice is saved in this browser.
      </p>
    </form>
  );
}
