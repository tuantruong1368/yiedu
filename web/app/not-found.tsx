"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { useI18n } from "@/components/locale-provider";
export default function NotFound() {
  const { t } = useI18n(),
    path = usePathname(),
    slug = /^\/t\/([a-z0-9-]+)(?:\/|$)/.exec(path)?.[1];
  return (
    <main className="route-state">
      <span className="route-state-icon">
        <Compass size={32} />
      </span>
      <span className="eyebrow">
        404 / {t("KHÔNG TÌM THẤY TRANG", "PAGE NOT FOUND")}
      </span>
      <h1>{t("Có lẽ bạn cần một lối khác.", "Let’s find another way.")}</h1>
      <p>
        {t(
          "Đường dẫn này không còn tồn tại hoặc chưa được xuất bản. Bạn có thể trở lại website để tiếp tục.",
          "This address is unavailable or has not been published. Return to the website to continue.",
        )}
      </p>
      <div className="actions">
        <Link className="button" href={slug ? `/t/${slug}` : "/#templates"}>
          {slug
            ? t("Về website", "Back to website")
            : t("Thư viện template", "Template library")}
        </Link>
        <Link className="button ghost" href="/dashboard">
          {t("Không gian của tôi", "My workspace")}
        </Link>
      </div>
    </main>
  );
}
