import { PlatformProvider } from "@/components/platform-provider";
import { publicApi } from "@/lib/api";
import { LocaleProvider } from "@/components/locale-provider";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import "./globals.css";
import "./experience.css";
import "./business.css";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const config = await publicApi("/platform/public").catch(() => null);
  const brand = config?.appearance?.name || "YiEdu";
  return {
    title: {
      default:
        locale === "en"
          ? `${brand} — A space for knowledge`
          : `${brand} — Không gian cho tri thức`,
      template: `%s · ${brand}`,
    },
    icons: {
      icon: "/brand/yiedu-symbol.svg",
      apple: "/brand/yiedu-symbol.svg",
    },
    description:
      locale === "en"
        ? "Build your own branded learning platform. Design, teach and support your learners."
        : "Tạo hệ thống đào tạo mang thương hiệu của bạn. Thiết kế, giảng dạy và đồng hành cùng học viên.",
  };
}
export default async function Root({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const config = await publicApi("/platform/public").catch(() => null);
  const appearance = config?.appearance;
  return (
    <html lang={locale}>
      <body
        style={
          {
            "--brand": appearance?.color,
            "--hero-bg": appearance?.hero_background,
          } as React.CSSProperties
        }
      >
        <PlatformProvider appearance={appearance}>
          <LocaleProvider initial={locale}>{children}</LocaleProvider>
        </PlatformProvider>
      </body>
    </html>
  );
}
