"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Header, ErrorBox } from "@/components/shared";
import { useI18n } from "@/components/locale-provider";
import OrderTable from "@/components/business/order-table";
export default function Page() {
  const { t } = useI18n(),
    [orders, setOrders] = useState<any[]>([]),
    [error, setError] = useState("");
  useEffect(() => {
    api("/payments/my-orders")
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <>
      <Header />
      <main className="workspace">
        <Link href="/dashboard" className="text-link">
          ← {t("Không gian của tôi", "My workspace")}
        </Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">YIEDU ORDERS</span>
            <h1>{t("Đơn hàng của tôi", "My orders")}</h1>
          </div>
        </div>
        <ErrorBox message={error} />
        <section className="panel">
          <OrderTable orders={orders} />
        </section>
      </main>
    </>
  );
}
