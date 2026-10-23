import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "YiEdu — Không gian cho tri thức", template: "%s · YiEdu" },
  description:
    "Tạo hệ thống đào tạo mang thương hiệu của bạn. Thiết kế, giảng dạy và đồng hành cùng học viên.",
};
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
