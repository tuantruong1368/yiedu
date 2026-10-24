"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "../locale-provider";
import { ErrorBox } from "../shared";
import PurchaseButton from "./purchase-button";
export default function PathAccess({
  path,
  store,
  data,
  onChange,
}: {
  path: any;
  store: any;
  data: any;
  onChange: () => Promise<any>;
}) {
  const { t } = useI18n(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const offer = store.offers.find(
      (o: any) => o.target_type === "path" && o.target_id === path.id,
    ),
    owned =
      path.course_ids.length > 0 &&
      path.course_ids.every((id: string) => data.enrolled.includes(id));
  const paidSeparately = path.course_ids.some((id: string) =>
    store.offers.some(
      (o: any) =>
        o.target_type === "course" &&
        o.target_id === id &&
        (o.mode === "paid" || !o.active),
    ),
  );
  if (owned)
    return (
      <span className="pill">
        {t(
          "Đã có quyền học các khóa trong lộ trình",
          "You have access to all courses in this pathway",
        )}
      </span>
    );
  if (offer && !offer.active)
    return <p>{t("Combo tạm dừng mở bán.", "Bundle sales are paused.")}</p>;
  if (offer?.mode === "paid")
    return (
      <PurchaseButton
        offer={offer}
        methods={store.methods}
        tenantId={data.tenant.id}
      />
    );
  if (!offer && paidSeparately)
    return (
      <small>
        {t(
          "Chọn khóa học bên dưới để xem hình thức đăng ký.",
          "Choose a course below to see enrollment options.",
        )}
      </small>
    );
  return (
    <div className="free-path-access">
      <button
        className="button ghost small"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api(`/runtime/${data.tenant.id}/paths/${path.id}/enroll`, {
              method: "POST",
            });
            await onChange();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {t("Ghi danh lộ trình miễn phí", "Join free pathway")}
      </button>
      <ErrorBox message={error} />
    </div>
  );
}
