import { LocaleProvider } from "@/components/locale-provider";
import { getLocale } from "@/lib/i18n/server";
import type { Metadata } from "next";
import "./globals.css";
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: {
      default:
        locale === "en"
          ? "YiEdu — A space for knowledge"
          : "YiEdu — Không gian cho tri thức",
      template: "%s · YiEdu",
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
  return (
    <html lang={locale}>
      <body>
        <LocaleProvider initial={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
