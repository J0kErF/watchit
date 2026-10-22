import { get, put } from "@vercel/blob";
import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";

/** The default embed player. It plays titles in the account's library and answers 404 for everything else. */
export const EMBED_URL = (process.env.EMBED_BASE_URL ?? "https://test.vc").replace(/\/+$/, "");

export const EMBED_COOKIE = "watchit-embed";

// Viewers can switch to their own library's embed host, from the hosts the site owner allows: the
// built-in ones (EMBED_HOSTS, comma-separated, "*.example.com" for subdomains; defaults to the default
// host and its subdomains) plus the ones added in the admin portal.
const DEFAULT_HOST = new URL(EMBED_URL).hostname;
export const BUILT_IN_HOSTS = (process.env.EMBED_HOSTS ?? `${DEFAULT_HOST},*.${DEFAULT_HOST}`)
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);

/** The hostname in "lib.example.com" or "https://lib.example.com/", or null unless it's an https domain name. */
export function toHost(input: string): string | null {
  const value = input.trim();
  let url: URL;
  try {
    url = new URL(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  // A dotted name whose last label isn't numeric: no IP addresses or bare names like "localhost".
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) && !/\.\d+$/.test(host) ? host : null;
}

/** A host or "*.domain" pattern as entered in the admin portal, normalized, or null if invalid. */
export function toHostPattern(input: string): string | null {
  const value = input.trim().toLowerCase();
  if (value.startsWith("*.")) {
    const host = toHost(value.slice(2));
    return host ? `*.${host}` : null;
  }
  return toHost(value);
}

const matches = (host: string, patterns: string[]) =>
  patterns.some((p) => (p.startsWith("*.") ? host.endsWith(p.slice(1)) : host === p));

const HOSTS_BLOB = "admin/embed-hosts.json";
export const HOSTS_TAG = "embed-hosts";

/** Hosts added in the admin portal, read fresh from Blob storage, or null when storage can't be read. */
export async function loadStoredHosts(): Promise<string[] | null> {
  try {
    const res = await get(HOSTS_BLOB, { access: "private", useCache: false });
    if (!res) return [];
    if (res.statusCode !== 200) return null;
    const hosts: unknown = await new Response(res.stream).json();
    return Array.isArray(hosts) ? hosts.filter((h): h is string => typeof h === "string") : [];
  } catch (err) {
    console.error(`Reading embed hosts failed: ${err}`);
    return null;
  }
}

export async function saveStoredHosts(hosts: string[]) {
  await put(HOSTS_BLOB, JSON.stringify(hosts), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

/**
 * Hosts added in the admin portal, cached. The admin portal refreshes the cache on change; other
 * server instances pick changes up within about a minute.
 */
export async function getStoredHosts(): Promise<string[]> {
  "use cache";
  cacheTag(HOSTS_TAG);
  cacheLife("minutes");
  return (await loadStoredHosts()) ?? [];
}

/** The embed URL for a viewer's domain, or null if the site owner hasn't allowed it. */
export async function resolveEmbedDomain(input: string): Promise<string | null> {
  const host = toHost(input);
  if (!host) return null;
  if (matches(host, BUILT_IN_HOSTS) || matches(host, await getStoredHosts())) return `https://${host}`;
  return null;
}

/** The embed URL for this request: the viewer's chosen library, or the default. */
export async function getEmbedUrl(): Promise<string> {
  const chosen = (await cookies()).get(EMBED_COOKIE)?.value;
  return (chosen && (await resolveEmbedDomain(chosen))) || EMBED_URL;
}
