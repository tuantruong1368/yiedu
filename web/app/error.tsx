"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useI18n } from "@/components/locale-provider";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t } = useI18n(),
    path = usePathname(),
    slug = /^\/t\/([a-z0-9-]+)(?:\/|$)/.exec(path)?.[1];
  return (
    <main className="route-state" role="alert">
      <span className="route-state-icon">
        <RefreshCw size={30} />
      </span>
      <span className="eyebrow">
        {t("KẾT NỐI BỊ GIÁN ĐOẠN", "CONNECTION INTERRUPTED")}
      </span>
      <h1>{t("Trang chưa tải được.", "This page could not load.")}</h1>
      <p>
        {t(
          "Hãy thử lại để tiếp tục tại địa chỉ hiện tại, hoặc quay về website.",
          "Try again at the current address, or return to the website.",
        )}
      </p>
      <div className="actions">
        <button type="button" className="button" onClick={reset}>
          {t("Thử lại", "Try again")}
        </button>
        <Link
          className="button ghost"
          href={slug ? `/t/${slug}` : "/#templates"}
        >
          {slug
            ? t("Về website", "Back to website")
            : t("Thư viện template", "Template library")}
        </Link>
      </div>
    </main>
  );
}
