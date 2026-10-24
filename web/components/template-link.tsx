"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "./locale-provider";
export default function TemplateLink({
  template,
  children,
}: {
  template: string;
  children: React.ReactNode;
}) {
  const router = useRouter(),
    { t } = useI18n();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div>
      <button
        className="template-card template-select"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const response = await fetch("/api/v1/auth/me", {
              credentials: "include",
            });
            if (response.status === 401) {
              router.push("/register?template=" + template);
              return;
            }
            if (!response.ok)
              throw new Error(
                t(
                  "Không thể kiểm tra tài khoản.",
                  "Could not check your session.",
                ),
              );
            const w = await api("/workspaces", {
              method: "POST",
              body: JSON.stringify({
                template_id: template,
                name: t("Website mới", "New website"),
                slug: "site-" + crypto.randomUUID().slice(0, 8),
              }),
            });
            router.push("/builder/" + w.id);
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy ? t("Đang mở trình thiết kế…", "Opening builder…") : children}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
