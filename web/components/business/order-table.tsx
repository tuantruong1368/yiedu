"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Check, ExternalLink, X } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "../locale-provider";
import { ErrorBox } from "../shared";
import { money } from "./pricing";
export function Status({ value }: { value: string }) {
  const { t } = useI18n();
  const names: Record<string, [string, string]> = {
    paid: ["Đã thanh toán", "Paid"],
    pending: ["Chờ thanh toán", "Pending"],
    cancelled: ["Đã hủy", "Cancelled"],
    expired: ["Hết hạn", "Expired"],
    refunded: ["Đã hoàn tiền", "Refunded"],
    failed: ["Thất bại", "Failed"],
  };
  return (
    <span className={`status-badge ${value}`}>
      {names[value] ? t(...names[value]) : value}
    </span>
  );
}
export default function OrderTable({
  orders,
  seller = false,
  onChange,
}: {
  orders: any[];
  seller?: boolean;
  onChange?: () => void;
}) {
  const route = usePathname(),
    query = useSearchParams(),
    returnTo = route + (query.size ? `?${query}` : "");
  const { t, locale } = useI18n(),
    [review, setReview] = useState<any>(null),
    [refund, setRefund] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function approve(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !confirm(
        t(
          "Anh/chị đã kiểm tra tiền thực nhận trong sao kê ngân hàng và đúng mã đơn?",
          "Have you verified the received bank payment and order reference?",
        ),
      )
    )
      return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(`/payments/orders/${review.id}/confirm-bank`, {
        method: "POST",
        body: JSON.stringify({
          transaction_id: f.get("transaction_id"),
          amount: Number(f.get("amount")),
          note: f.get("note"),
        }),
      });
      setReview(null);
      onChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="table-scroll">
        <table className="business-table">
          <thead>
            <tr>
              <th>{t("Đơn hàng", "Order")}</th>
              <th>{t("Số tiền", "Amount")}</th>
              <th>{t("Phương thức", "Method")}</th>
              <th>{t("Trạng thái", "Status")}</th>
              <th>{t("Thao tác", "Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <b>{o.items.title}</b>
                  <small>
                    {new Date(o.created_at).toLocaleString(
                      locale === "vi" ? "vi-VN" : "en-US",
                    )}{" "}
                    · {o.id.slice(0, 8)}
                  </small>
                </td>
                <td>{money(o.amount, o.currency, locale)}</td>
                <td>
                  {o.provider.toUpperCase()}
                  {o.sandbox && <small>Sandbox</small>}
                </td>
                <td>
                  <Status value={o.status} />
                </td>
                <td>
                  <div className="actions">
                    <Link
                      className="text-link"
                      href={`/checkout/${o.id}?returnTo=${encodeURIComponent(returnTo)}`}
                    >
                      <ExternalLink size={14} />
                      {t("Chi tiết", "Details")}
                    </Link>
                    {seller &&
                      o.provider === "bank" &&
                      ["pending", "expired", "cancelled"].includes(
                        o.status,
                      ) && (
                        <button
                          className="button small ghost"
                          onClick={() => {
                            setError("");
                            setReview(o);
                          }}
                        >
                          {t("Đối soát", "Reconcile")}
                        </button>
                      )}
                    {seller && o.status === "paid" && (
                      <button
                        className="text-link"
                        onClick={() => {
                          setError("");
                          setRefund(o);
                        }}
                      >
                        {t("Ghi nhận hoàn tiền", "Record refund")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && (
          <div className="empty">
            <p>{t("Chưa có đơn hàng.", "No orders yet.")}</p>
          </div>
        )}
      </div>
      {review && (
        <div className="business-modal-backdrop">
          <section
            className="business-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-review-title"
          >
            <div className="section-title">
              <h2 id="bank-review-title">
                {t("Xác nhận tiền thực nhận", "Confirm received transfer")}
              </h2>
              <button
                className="icon-button"
                onClick={() => setReview(null)}
                aria-label={t("Đóng", "Close")}
              >
                <X />
              </button>
            </div>
            <p>
              {review.items.title} ·{" "}
              {money(review.amount, review.currency, locale)}
            </p>
            <code>{review.transfer_reference}</code>
            <ErrorBox message={error} />
            <form onSubmit={approve}>
              <label>
                {t("Mã giao dịch trong sao kê", "Statement transaction ID")}
                <input
                  name="transaction_id"
                  required
                  minLength={5}
                  maxLength={150}
                  pattern="[a-zA-Z0-9._:/-]+"
                />
              </label>
              <label>
                {t("Số tiền thực nhận (VND)", "Received amount (VND)")}
                <input name="amount" type="number" required min={1} />
              </label>
              <label>
                {t("Ghi chú đối soát", "Reconciliation note")}
                <textarea
                  name="note"
                  required
                  minLength={5}
                  maxLength={1000}
                  rows={3}
                />
              </label>
              <button className="button" disabled={busy}>
                <Check size={16} />
                {t("Xác nhận và cấp quyền", "Confirm and grant access")}
              </button>
            </form>
          </section>
        </div>
      )}
      {refund && (
        <div className="business-modal-backdrop">
          <section
            className="business-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-heading"
          >
            <div className="section-title">
              <h2 id="refund-heading">
                {t(
                  "Ghi nhận hoàn tiền đã thực hiện",
                  "Record an executed refund",
                )}
              </h2>
              <button
                className="icon-button"
                onClick={() => setRefund(null)}
                aria-label={t("Đóng", "Close")}
              >
                <X />
              </button>
            </div>
            <p>
              {t(
                "Thực hiện hoàn tiền trên PayPal, MoMo hoặc ngân hàng trước. Thao tác này chỉ ghi nhận chứng từ và điều chỉnh quyền học; không chuyển tiền.",
                "Execute the refund through PayPal, MoMo or your bank first. This action only records the receipt and adjusts access; it does not transfer money.",
              )}
            </p>
            <p>
              {refund.items.title} ·{" "}
              {money(refund.amount, refund.currency, locale)}
            </p>
            <ErrorBox message={error} />
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  !confirm(
                    t(
                      "Đã hoàn đủ số tiền cho người mua và kiểm tra chứng từ?",
                      "Have you returned the full amount and verified the refund receipt?",
                    ),
                  )
                )
                  return;
                const f = new FormData(e.currentTarget);
                setBusy(true);
                try {
                  await api(`/payments/orders/${refund.id}/record-refund`, {
                    method: "POST",
                    body: JSON.stringify({
                      transaction_id: f.get("transaction_id"),
                      amount: refund.amount,
                      note: f.get("note"),
                    }),
                  });
                  setRefund(null);
                  onChange?.();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                {t("Mã giao dịch hoàn tiền", "Refund transaction ID")}
                <input
                  name="transaction_id"
                  required
                  minLength={5}
                  maxLength={150}
                  pattern="[a-zA-Z0-9._:/-]+"
                />
              </label>
              <label>
                {t("Ghi chú và chứng từ đối chiếu", "Reconciliation note")}
                <textarea
                  name="note"
                  minLength={10}
                  maxLength={1000}
                  required
                  rows={3}
                />
              </label>
              <button className="button" disabled={busy}>
                {t("Ghi nhận và cập nhật quyền", "Record and update access")}
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
