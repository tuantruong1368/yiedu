import messages from "./messages.en.json";
export type Locale = "vi" | "en";
export type Translate = (vi: string, en?: string) => string;
export function translator(locale: Locale): Translate {
  return (vi, en) =>
    locale === "vi" ? vi : en || (messages as Record<string, string>)[vi] || vi;
}
