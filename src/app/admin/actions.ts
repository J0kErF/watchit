"use server";

import { updateTag } from "next/cache";
import { checkPassword, endSession, isAdmin, startSession } from "@/lib/admin";
import { HOSTS_TAG, loadStoredHosts, saveStoredHosts, toHostPattern } from "@/lib/embed";

export type AdminState = { ok: boolean; message: string } | null;

export async function login(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!checkPassword(String(form.get("password") ?? ""))) {
    // Slow down password guessing.
    await new Promise((r) => setTimeout(r, 1000));
    return { ok: false, message: "Wrong password." };
  }
  await startSession();
  return null;
}

export async function logout() {
  await endSession();
}

/** Apply a change to the stored host list, from a fresh read so concurrent edits aren't lost. */
async function updateHosts(change: (hosts: string[]) => string[]): Promise<boolean> {
  const hosts = await loadStoredHosts();
  if (!hosts) return false;
  await saveStoredHosts(change(hosts));
  updateTag(HOSTS_TAG);
  return true;
}

export async function addHost(_prev: AdminState, form: FormData): Promise<AdminState> {
  if (!(await isAdmin())) return { ok: false, message: "Your session expired. Sign in again." };
  const host = toHostPattern(String(form.get("host") ?? ""));
  if (!host) return { ok: false, message: "Enter a domain like library.example.com, or *.example.com for its subdomains." };
  const saved = await updateHosts((hosts) => (hosts.includes(host) ? hosts : [...hosts, host]));
  return saved
    ? { ok: true, message: `Added ${host}. Viewers can now pick it on the Library page.` }
    : { ok: false, message: "Couldn’t reach storage. Try again in a moment." };
}

export async function removeHost(form: FormData) {
  if (!(await isAdmin())) return;
  const host = String(form.get("host") ?? "");
  await updateHosts((hosts) => hosts.filter((h) => h !== host));
}
