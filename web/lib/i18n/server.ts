import { cookies } from "next/headers";
import { Locale, translator } from "./locale";
export async function getLocale(): Promise<Locale> {
  return (await cookies()).get("yiedu_locale")?.value === "en" ? "en" : "vi";
}
export async function getT() {
  return translator(await getLocale());
}
