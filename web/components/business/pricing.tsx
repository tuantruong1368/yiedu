"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sprout, TrendingUp, Building2 } from "lucide-react";
import { useI18n } from "../locale-provider";
export function money(amount: number, currency = "VND", locale = "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(currency === "USD" ? amount / 100 : amount);
}
export default function Pricing({
  billing,
  onChoose,
  disabled = false,
}: {
  billing: any;
  onChoose?: (plan: string, interval: string) => void;
  disabled?: boolean;
}) {
  const { t, locale } = useI18n(),
    [annual, setAnnual] = useState(false);
  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-intro">
        <span className="eyebrow">GROW WITH YIEDU</span>
        <h2>
          {t(
            "Học viện của bạn, một khởi đầu nhẹ nhàng.",
            "Your academy. Room to grow.",
          )}
        </h2>
        <p>
          {t(
            "Dùng thử 30 ngày. Không cần thẻ. Chọn gói khi bạn sẵn sàng.",
            "30 days to build. No card required. Choose a plan when you are ready.",
          )}
        </p>
        <div
          className="segmented"
          aria-label={t("Kỳ thanh toán", "Billing period")}
        >
          <button aria-pressed={!annual} onClick={() => setAnnual(false)}>
            {t("Hàng tháng", "Monthly")}
          </button>
          <button aria-pressed={annual} onClick={() => setAnnual(true)}>
            {t("Hàng năm · tiết kiệm 2 tháng", "Yearly · save 2 months")}
          </button>
        </div>
      </div>
      <div className="pricing-grid">
        {Object.entries(billing.plans).map(([id, p]: [string, any], i) => {
          const Icon = [Sprout, TrendingUp, Building2][i];
          return (
            <article
              className={`pricing-card ${id === "growth" ? "featured" : ""}`}
              key={id}
            >
              {id === "growth" && (
                <span className="pricing-ribbon">
                  {t(
                    "DÀNH CHO HỌC VIỆN ĐANG PHÁT TRIỂN",
                    "FOR GROWING ACADEMIES",
                  )}
                </span>
              )}
              <Icon size={28} />
              <h3>{p.name.split(" / ")[locale === "vi" ? 0 : 1] || p.name}</h3>
              <div className="plan-price">
                {money(p.monthly_vnd * (annual ? 10 : 1), "VND", locale)}
                <small>
                  {" "}
                  / {annual ? t("năm", "year") : t("30 ngày", "30 days")}
                </small>
              </div>
              <p>
                {t("Thanh toán PayPal:", "PayPal price:")}{" "}
                {money(p.monthly_usd * (annual ? 10 : 1), "USD", locale)}
              </p>
              <ul>
                {[
                  `${p.courses} ${t("khóa học", "courses")}`,
                  `${p.learners.toLocaleString()} ${t("học viên", "learners")}`,
                  `${p.ai_daily} ${t("lượt tạo AI/ngày với API riêng", "AI generations/day with your API key")}`,
                  t(
                    "Website Studio, slide & mô phỏng",
                    "Website Studio, slides & simulations",
                  ),
                  t("0% phí giao dịch từ YiEdu", "0% YiEdu transaction fee"),
                ].map((x) => (
                  <li key={x}>
                    <Check size={16} />
                    {x}
                  </li>
                ))}
              </ul>
              {onChoose ? (
                <button
                  className={`button ${id === "growth" ? "" : "ghost"}`}
                  disabled={disabled}
                  onClick={() => onChoose(id, annual ? "year" : "month")}
                >
                  {t("Chọn gói", "Choose plan")}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  href="/dashboard"
                  className={`button ${id === "growth" ? "" : "ghost"}`}
                >
                  {t("Bắt đầu 30 ngày miễn phí", "Start your 30-day trial")}
                  <ArrowRight size={16} />
                </Link>
              )}
            </article>
          );
        })}
      </div>
      <p className="pricing-footnote">
        {t(
          "Giá do YiEdu niêm yết, có thể điều chỉnh trong quản trị. Phí cổng thanh toán và OpenAI API tính riêng. Gia hạn chủ động, không tự trừ tiền. Gói tháng có 30 ngày; gói năm có 365 ngày.",
          "Prices are set by YiEdu and editable in administration. Payment processing and OpenAI API costs are separate. Prepaid renewal with no automatic debit. Monthly terms last 30 days; annual terms last 365 days.",
        )}
      </p>
    </section>
  );
}
