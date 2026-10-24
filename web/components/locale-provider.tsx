"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Locale, translator } from "@/lib/i18n/locale";
const Context = createContext({
  locale: "vi" as Locale,
  setLocale: (_: Locale) => {},
});
export function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: React.ReactNode;
}) {
  const [locale, set] = useState(initial);
  const router = useRouter();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <Context.Provider
      value={{
        locale,
        setLocale: (value) => {
          set(value);
          document.cookie = `yiedu_locale=${value};path=/;max-age=31536000;SameSite=Lax`;
          router.refresh();
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useI18n() {
  const value = useContext(Context);
  return { ...value, t: translator(value.locale) };
}
export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <select
      aria-label="Language / Ngôn ngữ"
      className="locale-switch"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      <option value="vi">Tiếng Việt</option>
      <option value="en">English</option>
    </select>
  );
}
