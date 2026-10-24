"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import { ErrorBox } from "../shared";
import { useI18n } from "../locale-provider";
import Pricing from "./pricing";
import OrderTable from "./order-table";
export default function BillingPanel({ tenantId }: { tenantId: string }) {
  const { t, locale } = useI18n(),
    router = useRouter(),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [method, setMethod] = useState("bank"),
    [busy, setBusy] = useState(false);
  const base = `/runtime/${tenantId}/billing`;
  const load = () =>
    api(base).then((d) => {
      setData(d);
      setMethod(d.methods[0] || "bank");
    });
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [base]);
  async function choose(plan: string, interval: string) {
    setBusy(true);
    setError("");
    try {
      const order = await api(base + "/checkout", {
        method: "POST",
        body: JSON.stringify({
          plan,
          interval,
          provider: method,
          request_key: crypto.randomUUID(),
        }),
      });
      router.push(`/checkout/${order.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="business-stack">
      <ErrorBox message={error} />
      {data && (
        <>
          <section
            className={`subscription-banner ${data.subscription.status === "expired" ? "expired" : ""}`}
          >
            <CalendarDays size={36} />
            <div>
              <span className="eyebrow">YIEDU MEMBERSHIP</span>
              <h2>
                {data.subscription.plan === "trial"
                  ? t(
                      "30 ngày để xây học viện của bạn.",
                      "30 days to build your academy.",
                    )
                  : data.plans[data.subscription.plan]?.name}
              </h2>
              <p>
                {t("Còn", "Remaining:")}{" "}
                <b>
                  {data.subscription.days_left} {t("ngày", "days")}
                </b>{" "}
                · {data.subscription.limits.courses} {t("khóa học", "courses")}{" "}
                · {data.subscription.limits.learners}{" "}
                {t("học viên", "learners")}
              </p>
              {data.subscription.status === "expired" && (
                <p>
                  {t(
                    "Gia hạn để tiếp tục tạo nội dung và nhận học viên mới. Nội dung, tiến độ và quyền học đã có được giữ nguyên.",
                    "Renew to resume authoring and accept new learners. Existing content, progress and learner access are preserved.",
                  )}
                </p>
              )}
            </div>
          </section>
          <section className="panel">
            <h3>
              {t(
                "Thanh toán phí dịch vụ cho YiEdu",
                "Pay your YiEdu service fee",
              )}
            </h3>
            <label>
              {t("Phương thức thanh toán", "Payment method")}
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                {data.methods.map((m: string) => (
                  <option key={m} value={m}>
                    {m === "bank"
                      ? t("Chuyển khoản ngân hàng", "Bank transfer")
                      : m.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            {!data.methods.length && (
              <p>
                {t(
                  "YiEdu chưa cấu hình cổng thu phí. Quản trị nền tảng có thể bật tại Kết nối; chưa phát sinh thanh toán.",
                  "YiEdu has not configured payment collection. The platform administrator can enable it under Connections.",
                )}
              </p>
            )}
            <small>
              {t(
                "Gói được kích hoạt sau khi xác minh thanh toán. Gia hạn cùng gói được cộng tiếp thời gian; đổi gói sau khi hết kỳ. Không tự trừ tiền.",
                "Activation follows payment verification. Renewals extend the current plan; plan changes are available after the term ends. No automatic debit.",
              )}
            </small>
          </section>
          {!data.site_published && data.subscription.active && (
            <section className="panel">
              <h3>
                {t("Hệ thống đã được kích hoạt.", "Your system is activated.")}
              </h3>
              <p>
                {t(
                  "Quay lại bản thiết kế để kiểm tra và xuất bản website.",
                  "Return to your design to review and publish the website.",
                )}
              </p>
              <button
                className="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const w = await api(`/me/sites/${tenantId}/design`, {
                      method: "POST",
                    });
                    router.push(`/builder/${w.id}`);
                  } catch (e) {
                    setError((e as Error).message);
                    setBusy(false);
                  }
                }}
              >
                {t("Tiếp tục xuất bản website", "Continue to publish website")}
              </button>
            </section>
          )}
          <Pricing
            billing={data}
            onChoose={choose}
            disabled={busy || !data.methods.length}
          />
          <section className="panel">
            <h2>{t("Lịch sử phí dịch vụ", "Service invoices")}</h2>
            <OrderTable orders={data.invoices} />
            <div className="info-callout">
              <ShieldCheck />
              <p>
                {t(
                  "Dùng thử bắt đầu khi xuất bản hệ thống đầu tiên. Tạo lại hệ thống bằng cùng tài khoản không đặt lại thời gian dùng thử.",
                  "The trial starts when your first system is published. Creating another system with the same account does not reset it.",
                )}
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
