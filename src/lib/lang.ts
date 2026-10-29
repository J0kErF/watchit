import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang, parseLang } from "./i18n";
import { KIDS_COOKIE, parseKids } from "./kids";

/** The viewer's interface language, from the cookie the navbar switch sets. */
export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

/** Whether Kids mode is on, from the cookie the navbar switch sets. */
export async function getKids(): Promise<boolean> {
  return parseKids((await cookies()).get(KIDS_COOKIE)?.value);
}
