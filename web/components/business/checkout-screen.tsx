"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Copy,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { checkoutReturnURL } from "@/lib/navigation";
import { api } from "@/lib/api";
import { useI18n } from "../locale-provider";
import { Header, ErrorBox, Loading } from "../shared";
import { money } from "./pricing";
import { Status } from "./order-table";
export default function CheckoutScreen({ id }: { id: string }) {
  const { t, locale } = useI18n(),
    query = useSearchParams();
  const [order, setOrder] = useState<any>(null),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [previous, setPrevious] = useState("");
  const auto = useRef(false),
    [slug, setSlug] = useState("");
  const path = `/payments/orders/${id}`;
  async function load() {
    const o = await api(path);
    setOrder(o);
    const d = await api("/me/dashboard");
    setSlug(d.sites.find((s: any) => s.id === o.tenant_id)?.slug || "");
    return o;
  }
  async function sync() {
    setBusy(true);
    setError("");
    try {
      const o = await api(path + "/sync", { method: "POST" });
      setOrder(o);
      if (o.status !== "paid")
        setNotice(
          t(
            "Chưa có xác nhận thanh toán thành công. Có thể kiểm tra lại sau.",
            "Payment has not been confirmed yet. You can check again shortly.",
          ),
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const incoming = query.get("returnTo");
    try {
      if (incoming) {
        sessionStorage.setItem("checkout-return:" + id, incoming);
        setPrevious(incoming);
      } else setPrevious(sessionStorage.getItem("checkout-return:" + id) || "");
    } catch {}
    load()
      .then((o) => {
        if (
          query.get("returned") === "1" &&
          o.status !== "paid" &&
          !auto.current
        ) {
          auto.current = true;
          sync();
        }
      })
      .catch((e) => setError(e.message));
  }, [id]);
  const fallback = slug
    ? order?.purpose === "subscription"
      ? `/t/${slug}/administrator?tab=billing`
      : `/t/${slug}/learn`
    : "/orders";
  const back = checkoutReturnURL(
    slug,
    query.get("returnTo") || previous,
    fallback,
  );
  return (
    <>
      <Header />
      <main className="workspace checkout-workspace">
        <Link className="text-link" href={back}>
          <ArrowLeft size={16} />
          {t("Quay lại", "Back")}
        </Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">YIEDU CHECKOUT</span>
            <h1>
              {t(
                "Một bước đến hành trình mới.",
                "Your next chapter starts here.",
              )}
            </h1>
          </div>
        </div>
        <ErrorBox message={error} />
        {!order && !error && <Loading />}
        {!order && error && (
          <Link
            className="button"
            href={`/login?returnTo=${encodeURIComponent(`/checkout/${id}`)}`}
          >
            {t("Đăng nhập để xem đơn", "Sign in to view this order")}
          </Link>
        )}
        {order && (
          <div className="checkout-grid">
            <section className="panel order-summary">
              <span className="eyebrow">
                {t("TÓM TẮT ĐƠN HÀNG", "ORDER SUMMARY")}
              </span>
              <h2>{order.items.title}</h2>
              <Status value={order.status} />
              <div className="checkout-total">
                {money(order.amount, order.currency, locale)}
              </div>
              <dl>
                <dt>{t("Mã đơn", "Order ID")}</dt>
                <dd className="break-anywhere">{order.id}</dd>
                <dt>{t("Phương thức", "Payment method")}</dt>
                <dd>{order.provider.toUpperCase()}</dd>
                <dt>{t("Hạn thanh toán", "Pay before")}</dt>
                <dd>
                  {new Date(order.expires_at).toLocaleString(
                    locale === "vi" ? "vi-VN" : "en-US",
                  )}
                </dd>
                {order.transaction_id && (
                  <>
                    <dt>{t("Mã giao dịch", "Transaction")}</dt>
                    <dd className="break-anywhere">{order.transaction_id}</dd>
                  </>
                )}
              </dl>
              {order.sandbox && (
                <div className="sandbox-banner">
                  {t(
                    "SANDBOX · Giao dịch thử nghiệm",
                    "SANDBOX · Test transaction",
                  )}
                </div>
              )}
              <small>
                {t(
                  "Giá niêm yết được chốt tại lúc tạo đơn. Phí quy đổi hoặc phí của ngân hàng/cổng thanh toán có thể do bên cung cấp thu.",
                  "The listed price is fixed at checkout. Your bank or payment provider may apply processing or conversion fees.",
                )}
              </small>
            </section>
            <section className="panel payment-instructions">
              {order.status === "paid" ? (
                <>
                  <div className="payment-success">
                    <CheckCircle2 size={52} />
                  </div>
                  <h2>
                    {t("Thanh toán đã được xác nhận.", "Payment confirmed.")}
                  </h2>
                  <p>
                    {t(
                      "Quyền truy cập đã được cập nhật. Bạn có thể tiếp tục từ trang trước.",
                      "Your access has been updated. You can continue from your workspace.",
                    )}
                  </p>
                  <Link className="button" href={back}>
                    {order.purpose === "subscription"
                      ? t("Về gói dịch vụ", "Back to membership")
                      : back.includes("/administrator")
                        ? t("Về quản trị", "Back to administration")
                        : back === "/orders"
                          ? t("Xem đơn hàng", "View orders")
                          : t("Vào học ngay", "Start learning")}
                  </Link>
                </>
              ) : order.status === "pending" ? (
                <>
                  <h2>{t("Hoàn tất thanh toán", "Complete your payment")}</h2>
                  {order.provider === "bank" ? (
                    <>
                      <p>
                        {t(
                          "Chuyển đúng số tiền và nội dung bên dưới vào tài khoản của bên bán.",
                          "Send the exact amount and reference below to the seller’s account.",
                        )}
                      </p>
                      <div className="bank-details">
                        <span>{order.receiver.bank_name}</span>
                        <strong>{order.receiver.account_number}</strong>
                        <b>{order.receiver.account_name}</b>
                        <small>{order.receiver.instructions}</small>
                      </div>
                      <label>
                        {t("Nội dung chuyển khoản", "Transfer reference")}
                        <div className="copy-reference">
                          <code>{order.transfer_reference}</code>
                          <button
                            className="icon-button"
                            aria-label={t("Sao chép mã", "Copy reference")}
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  order.transfer_reference,
                                );
                                setNotice(t("Đã sao chép.", "Copied."));
                              } catch {
                                setNotice(
                                  t(
                                    "Vui lòng sao chép mã hiển thị.",
                                    "Please copy the displayed reference.",
                                  ),
                                );
                              }
                            }}
                          >
                            <Copy size={17} />
                          </button>
                        </div>
                      </label>
                      <div className="info-callout">
                        <ShieldCheck />
                        <p>
                          {t(
                            "Bên bán sẽ kiểm tra sao kê và xác nhận. Nhấn kiểm tra chỉ cập nhật trạng thái, không tự đánh dấu đã trả tiền.",
                            "The seller will reconcile their statement and confirm payment. Checking status does not mark the order as paid.",
                          )}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p>
                        {t(
                          "Thanh toán trên trang bảo mật của nhà cung cấp. Sau khi được chuyển về, YiEdu kiểm tra giao dịch trước khi cấp quyền.",
                          "Complete payment on the provider’s secure page. YiEdu verifies the transaction before granting access.",
                        )}
                      </p>
                      {order.checkout_url && (
                        <a className="button" href={order.checkout_url}>
                          {t("Tiếp tục với", "Continue with")}{" "}
                          {order.provider.toUpperCase()}
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </>
                  )}
                  <div className="actions">
                    <button
                      className="button ghost"
                      disabled={busy}
                      onClick={sync}
                    >
                      <RefreshCw size={16} />
                      {busy
                        ? t("Đang kiểm tra…", "Checking…")
                        : t("Kiểm tra thanh toán", "Check payment")}
                    </button>
                    <button
                      className="text-link danger-text"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          !confirm(
                            t(
                              "Hủy đơn đang chờ này? Nếu đã trả tiền, kiểm tra thanh toán trước.",
                              "Cancel this pending order? If you already paid, check the payment first.",
                            ),
                          )
                        )
                          return;
                        setBusy(true);
                        try {
                          setOrder(
                            await api(path + "/cancel", { method: "POST" }),
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {t("Hủy đơn", "Cancel order")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>
                    {t(
                      "Đơn không còn chờ thanh toán.",
                      "This order is no longer pending.",
                    )}
                  </h2>
                  <p>
                    {t(
                      "Nếu tiền đã bị trừ, hãy kiểm tra lại giao dịch để đối soát với nhà cung cấp.",
                      "If you were charged, check the transaction to reconcile with the provider.",
                    )}
                  </p>
                  {order.provider !== "bank" && (
                    <button
                      className="button ghost"
                      onClick={sync}
                      disabled={busy}
                    >
                      {t("Đối soát giao dịch", "Reconcile payment")}
                    </button>
                  )}
                  <Link href={back} className="text-link">
                    {t("Quay lại", "Back")}
                  </Link>
                </>
              )}
              {order.review_note && order.status === "pending" && (
                <ErrorBox message={order.review_note} />
              )}
              {notice && (
                <div className="notice" role="status">
                  {notice}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}
