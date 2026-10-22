import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/PageHeader";
import { adminEnabled, isAdmin } from "@/lib/admin";
import { BUILT_IN_HOSTS, loadStoredHosts } from "@/lib/embed";
import { logout, removeHost } from "./actions";
import { AddHostForm, LoginForm } from "./forms";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="px-4 pb-16 pt-28 sm:px-12">
      <PageHeader title="Admin" subtitle="Choose which embed domains viewers can connect on the Library page." />
      <Suspense>
        <Admin />
      </Suspense>
    </div>
  );
}

async function Admin() {
  if (!adminEnabled) return <p className="text-muted">Set the ADMIN_PASSWORD environment variable to turn on the admin portal.</p>;
  if (!(await isAdmin())) return <LoginForm />;

  const stored = await loadStoredHosts();
  return (
    <div className="space-y-10">
      <AddHostForm />

      <section className="max-w-xl">
        <h2 className="mb-3 text-xl font-semibold">Allowed domains</h2>
        {stored === null && <p className="mb-3 text-sm text-red-400">Couldn’t read the saved domains. Reload to try again.</p>}
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {BUILT_IN_HOSTS.map((host) => (
            <li key={host} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>{host}</span>
              <span className="text-xs text-muted">Built in</span>
            </li>
          ))}
          {(stored ?? []).map((host) => (
            <li key={host} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span>{host}</span>
              <form action={removeHost}>
                <input type="hidden" name="host" value={host} />
                <button type="submit" className="text-xs text-muted underline-offset-4 hover:text-foreground hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Built-in domains come from the EMBED_HOSTS environment variable. Each domain’s embed provider must also
          safelist this site.
        </p>
      </section>

      <form action={logout}>
        <button type="submit" className="text-sm text-muted underline-offset-4 hover:text-foreground hover:underline">
          Sign out
        </button>
      </form>
    </div>
  );
}
