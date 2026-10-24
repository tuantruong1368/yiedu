"use client";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "../locale-provider";
import { ErrorBox } from "../shared";
import { money } from "./pricing";
export default function PurchaseButton({
  offer,
  methods,
  tenantId,
}: {
  offer: any;
  methods: string[];
  tenantId: string;
}) {
  const path = usePathname(),
    query = useSearchParams();
  const { t, locale } = useI18n(),
    router = useRouter(),
    available = methods.filter((m) =>
      m === "paypal" ? offer.price_usd > 0 : offer.price_vnd > 0,
    ),
    [method, setMethod] = useState(available[0] || "bank"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <div className="purchase-box">
      <b>
        {offer.price_vnd
          ? money(offer.price_vnd, "VND", locale)
          : money(offer.price_usd, "USD", locale)}
      </b>
      {offer.price_usd > 0 && offer.price_vnd > 0 && (
        <small>PayPal: {money(offer.price_usd, "USD", locale)}</small>
      )}
      <label>
        {t("Thanh toán bằng", "Pay with")}
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          {available.map((m) => (
            <option key={m} value={m}>
              {m === "bank" ? t("Ngân hàng", "Bank transfer") : m.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button"
        disabled={busy || !available.length}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const order = await api(`/runtime/${tenantId}/checkout`, {
              method: "POST",
              body: JSON.stringify({
                offer_id: offer.id,
                provider: method,
                request_key: crypto.randomUUID(),
              }),
            });
            router.push(
              `/checkout/${order.id}?returnTo=${encodeURIComponent(path + (query.size ? `?${query}` : ""))}`,
            );
          } catch (e) {
            setError((e as Error).message);
            setBusy(false);
          }
        }}
      >
        <ShoppingBag size={16} />
        {busy
          ? t("Đang tạo đơn…", "Creating order…")
          : t("Mua và bắt đầu học", "Buy and start learning")}
      </button>
      {!available.length && (
        <small>
          {t(
            "Bên bán đang cấu hình thanh toán.",
            "The seller is setting up payment methods.",
          )}
        </small>
      )}
      <ErrorBox message={error} />
    </div>
  );
}
