"use client";
import { useEffect, useState } from "react";
import { Banknote, Package, ShoppingBag, Download, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { ErrorBox } from "../shared";
import { useI18n } from "../locale-provider";
import OrderTable from "./order-table";
import { money } from "./pricing";
export default function CommercePanel({ overview }: { overview: any }) {
  const { t, locale } = useI18n(),
    base = `/runtime/${overview.tenant.id}`,
    [data, setData] = useState<any>(null),
    [target, setTarget] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const targets = [
    ...overview.courses.map((c: any) => ({
      ...c,
      type: "course",
      label: t("Khóa học", "Course"),
    })),
    ...overview.paths.map((p: any) => ({
      ...p,
      type: "path",
      label: t("Combo lộ trình", "Pathway bundle"),
    })),
  ];
  const current = data?.offers.find(
    (o: any) => `${o.target_type}:${o.target_id}` === target,
  );
  async function load() {
    setData(await api(base + "/commerce"));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [base]);
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      [target_type, target_id] = target.split(":");
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(base + "/offers", {
        method: "PUT",
        body: JSON.stringify({
          target_type,
          target_id,
          mode: f.get("mode"),
          price_vnd: Number(f.get("price_vnd")),
          price_usd: Math.round(Number(f.get("price_usd")) * 100),
          active: f.get("active") === "on",
          revision: current?.revision || 0,
        }),
      });
      await load();
      setNotice(t("Đã lưu hình thức bán.", "Offer saved."));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="business-stack">
      <div className="info-callout">
        <ShoppingBag />
        <p>
          {t(
            "Bán từng khóa hoặc cả combo theo lộ trình. Giá VND dành cho MoMo/ngân hàng; giá USD dành cho PayPal, không tự quy đổi. Cấu hình tài khoản nhận tiền tại Kết nối.",
            "Sell individual courses or pathway bundles. VND prices apply to MoMo/bank; USD prices apply to PayPal, without automatic conversion. Set receiving accounts under Connections.",
          )}
        </p>
      </div>
      <ErrorBox message={error} />
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <div className="commerce-layout">
        <section className="panel">
          <h2>
            <Tag size={22} />{" "}
            {t("Niêm yết sản phẩm học tập", "Learning offers")}
          </h2>
          <label>
            {t("Khóa học hoặc lộ trình", "Course or pathway")}
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">
                {t("Chọn nội dung đã xuất bản", "Choose published content")}
              </option>
              {targets.map((x) => (
                <option key={x.type + x.id} value={`${x.type}:${x.id}`}>
                  {x.label} · {x.title}
                </option>
              ))}
            </select>
          </label>
          {target && (
            <form key={target + ":" + (current?.revision || 0)} onSubmit={save}>
              <label>
                {t("Hình thức", "Access")}
                <select name="mode" defaultValue={current?.mode || "free"}>
                  <option value="free">{t("Miễn phí", "Free")}</option>
                  <option value="paid">{t("Trả phí", "Paid")}</option>
                </select>
              </label>
              <div className="form-pair">
                <label>
                  {t("Giá VND", "VND price")}
                  <input
                    type="number"
                    name="price_vnd"
                    defaultValue={current?.price_vnd || 0}
                    min={0}
                    max={1000000000}
                    step={1000}
                  />
                </label>
                <label>
                  {t("Giá USD cho PayPal", "USD price for PayPal")}
                  <input
                    type="number"
                    name="price_usd"
                    defaultValue={(current?.price_usd || 0) / 100}
                    min={0}
                    max={1000000}
                    step="0.01"
                  />
                </label>
              </div>
              <small className="form-help">
                {t(
                  "Để 0 ở đồng tiền chưa muốn bán. Combo cấp quyền tất cả khóa trong lộ trình tại lúc mua; thứ tự học vẫn được giữ.",
                  "Use 0 for an unavailable currency. A bundle grants all courses in the pathway at purchase time; learning prerequisites still apply.",
                )}
              </small>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={current?.active ?? true}
                />
                {t(
                  "Cho phép đăng ký/mở bán mới",
                  "Accept new enrollments/purchases",
                )}
              </label>
              <button className="button" disabled={busy}>
                {t("Lưu hình thức bán", "Save offer")}
              </button>
            </form>
          )}
          {data?.offers.map((o: any) => {
            const x = targets.find(
              (x) => x.id === o.target_id && x.type === o.target_type,
            );
            return (
              <button
                className="offer-row"
                key={o.id}
                onClick={() => setTarget(`${o.target_type}:${o.target_id}`)}
              >
                {o.target_type === "path" ? (
                  <Package size={18} />
                ) : (
                  <Banknote size={18} />
                )}
                <span>
                  <b>{x?.title || t("Nội dung đã xóa", "Removed content")}</b>
                  <small>
                    {o.mode === "free"
                      ? t("Miễn phí", "Free")
                      : [
                          o.price_vnd ? money(o.price_vnd, "VND", locale) : "",
                          o.price_usd ? money(o.price_usd, "USD", locale) : "",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                  </small>
                </span>
                <small>
                  {o.active ? t("Đang mở", "Active") : t("Tạm dừng", "Paused")}
                </small>
              </button>
            );
          })}
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>{t("Đơn hàng khóa học", "Course orders")}</h2>
            <a
              className="text-link"
              href={`/api/v1${base}/orders.csv`}
              download
            >
              <Download size={15} />
              CSV
            </a>
          </div>
          <OrderTable orders={data?.orders || []} seller onChange={load} />
        </section>
      </div>
    </div>
  );
}
