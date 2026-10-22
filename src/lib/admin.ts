import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const PASSWORD = process.env.ADMIN_PASSWORD;
const COOKIE = "watchit-admin";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

export const adminEnabled = Boolean(PASSWORD);

// Compare digests so the comparison takes the same time whatever the input.
const same = (a: string, b: string) =>
  timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

// Sessions are signed with the password, so changing ADMIN_PASSWORD signs everyone out.
const sign = (value: string) => createHmac("sha256", PASSWORD ?? "").update(value).digest("hex");

export const checkPassword = (input: string) => adminEnabled && same(input, PASSWORD!);

export async function startSession() {
  const issued = String(Date.now());
  (await cookies()).set(COOKIE, `${issued}.${sign(issued)}`, {
    path: "/admin",
    maxAge: SESSION_MS / 1000,
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
}

export async function endSession() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin() {
  if (!adminEnabled) return false;
  const [issued, signature] = (await cookies()).get(COOKIE)?.value.split(".") ?? [];
  if (!issued || !signature || !same(signature, sign(issued))) return false;
  return Date.now() - Number(issued) < SESSION_MS;
}
