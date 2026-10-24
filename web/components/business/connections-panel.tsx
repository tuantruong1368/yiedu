"use client";
import { useEffect, useState } from "react";
import {
  Landmark,
  Wallet,
  Sparkles,
  Smartphone,
  KeyRound,
  Unplug,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { ErrorBox } from "../shared";
import { useI18n } from "../locale-provider";
const fields: Record<string, [string, string, string][]> = {
  openai: [
    ["model", "Model", "Model"],
    ["daily_limit", "Giới hạn lượt/ngày", "Daily generation limit"],
    ["max_output_tokens", "Giới hạn token đầu ra", "Maximum output tokens"],
  ],
  paypal: [
    ["client_id", "Client ID", "Client ID"],
    ["merchant_id", "Merchant ID nhận tiền", "Receiving merchant ID"],
    ["webhook_id", "Webhook ID (nếu dùng webhook)", "Webhook ID (optional)"],
  ],
  momo: [
    ["partner_code", "Partner code", "Partner code"],
    ["access_key", "Access key", "Access key"],
  ],
  bank: [
    ["bank_name", "Tên ngân hàng", "Bank name"],
    ["account_number", "Số tài khoản", "Account number"],
    ["account_name", "Chủ tài khoản", "Account holder"],
    ["instructions", "Hướng dẫn chuyển khoản", "Transfer instructions"],
  ],
};
const secretFields: Record<string, [string, string][]> = {
  openai: [["api_key", "OpenAI API key"]],
  paypal: [["client_secret", "Client secret"]],
  momo: [["secret_key", "Secret key"]],
  bank: [],
};
const defaults: Record<string, any> = {
  openai: { model: "gpt-4o-mini", daily_limit: 20, max_output_tokens: 12000 },
  paypal: { mode: "sandbox" },
  momo: { mode: "sandbox" },
  bank: {},
};
export default function ConnectionsPanel({ scope }: { scope: string }) {
  const { t } = useI18n(),
    [rows, setRows] = useState<any[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState("");
  const load = () => api(`/connections/${scope}`).then(setRows);
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [scope]);
  async function save(e: React.FormEvent<HTMLFormElement>, provider: string) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      form = e.currentTarget;
    setBusy(provider);
    setError("");
    setNotice("");
    const config: any = {};
    for (const [key] of fields[provider])
      config[key] = ["daily_limit", "max_output_tokens"].includes(key)
        ? Number(f.get(key))
        : String(f.get(key) || "");
    if (["paypal", "momo"].includes(provider)) config.mode = f.get("mode");
    try {
      await api(`/connections/${scope}/${provider}`, {
        method: "PUT",
        body: JSON.stringify({
          enabled: f.get("enabled") === "on",
          config,
          secrets: Object.fromEntries(
            secretFields[provider].map(([key]) => [key, f.get(key) || ""]),
          ),
          revision: rows.find((r) => r.provider === provider)?.revision || 0,
        }),
      });
      for (const [key] of secretFields[provider])
        (form.elements.namedItem(key) as HTMLInputElement).value = "";
      await load();
      setNotice(t("Đã lưu kết nối.", "Connection saved."));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="business-stack">
      <div className="info-callout">
        <ShieldCheck />
        <p>
          {t(
            scope === "platform"
              ? "Các cổng thanh toán ở đây nhận phí dịch vụ của YiEdu. Tiền mua khóa học sử dụng kết nối riêng tại tenant."
              : "Cấu hình tài khoản của bên bán để nhận tiền khóa học trực tiếp. Chỉ chủ sở hữu được thay đổi kết nối.",
            scope === "platform"
              ? "These payment accounts receive YiEdu subscription fees. Course sales use each tenant’s own connections."
              : "Connect the seller’s own accounts to receive course payments directly. Only the owner can change connections.",
          )}
        </p>
      </div>
      <ErrorBox message={error} />
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      <div className="connection-grid">
        {["openai", "paypal", "momo", "bank"].map((provider, i) => {
          const row = rows.find((r) => r.provider === provider),
            config = { ...defaults[provider], ...row?.config },
            Icon = [Sparkles, Wallet, Smartphone, Landmark][i];
          return (
            <form
              key={provider + ":" + (row?.revision || 0)}
              className="connection-card"
              onSubmit={(e) => save(e, provider)}
            >
              <div className="section-title">
                <div className={`connection-icon connection-${provider}`}>
                  <Icon />
                </div>
                <span className={`status-badge ${row?.enabled ? "paid" : ""}`}>
                  {row?.enabled
                    ? t("Đã bật", "Enabled")
                    : t("Chưa bật", "Disabled")}
                </span>
              </div>
              <h3>
                {provider === "openai"
                  ? "OpenAI · ChatGPT"
                  : provider === "bank"
                    ? t("Chuyển khoản ngân hàng", "Bank transfer")
                    : provider === "paypal"
                      ? "PayPal"
                      : "MoMo"}
              </h3>
              <p>
                {provider === "openai"
                  ? t(
                      "Kết nối bằng OpenAI API key. Phí API tính riêng với gói ChatGPT. Khóa đã lưu không hiển thị lại.",
                      "Connect an OpenAI API key. API billing is separate from ChatGPT subscriptions. Saved secrets are never shown again.",
                    )
                  : provider === "bank"
                    ? t(
                        "Học viên chuyển khoản theo mã đơn. Quản trị đối chiếu sao kê và xác nhận; chưa tự động kết nối ngân hàng.",
                        "Buyers transfer using the order reference. An administrator reconciles the bank statement and confirms receipt.",
                      )
                    : t(
                        "Bắt đầu bằng sandbox để kiểm tra. Chỉ bật Live sau khi tài khoản merchant được duyệt và thử nghiệm đầy đủ.",
                        "Start with sandbox. Switch to Live after merchant approval and end-to-end testing.",
                      )}
              </p>
              {["paypal", "momo"].includes(provider) && (
                <label>
                  {t("Môi trường", "Environment")}
                  <select name="mode" defaultValue={config.mode}>
                    <option value="sandbox">
                      Sandbox · {t("thử nghiệm", "testing")}
                    </option>
                    <option value="live">
                      Live · {t("tiền thật", "real payments")}
                    </option>
                  </select>
                </label>
              )}
              {fields[provider].map(([key, vi, en]) => (
                <label key={key}>
                  {t(vi, en)}
                  <input
                    name={key}
                    type={
                      ["daily_limit", "max_output_tokens"].includes(key)
                        ? "number"
                        : "text"
                    }
                    maxLength={2000}
                    defaultValue={config[key] ?? ""}
                  />
                </label>
              ))}
              {secretFields[provider].map(([key, label]) => (
                <label key={key}>
                  <span>
                    <KeyRound size={13} /> {label}
                  </span>
                  <input
                    name={key}
                    type="password"
                    autoComplete="new-password"
                    maxLength={4000}
                    placeholder={
                      row?.has_secret
                        ? t(
                            "Đã lưu · để trống để giữ nguyên",
                            "Saved · leave blank to keep",
                          )
                        : t("Nhập khóa kết nối", "Enter your key")
                    }
                  />
                </label>
              ))}
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={row?.enabled}
                />
                {t("Bật kết nối", "Enable connection")}
              </label>
              <div className="actions">
                <button className="button small" disabled={!!busy}>
                  {busy === provider
                    ? t("Đang lưu…", "Saving…")
                    : t("Lưu cấu hình", "Save connection")}
                </button>
                {row && (
                  <button
                    type="button"
                    className="text-link"
                    disabled={!!busy}
                    onClick={async () => {
                      if (
                        !confirm(
                          t(
                            "Ngắt kết nối và xóa khóa đã lưu?",
                            "Disconnect and erase the saved secret?",
                          ),
                        )
                      )
                        return;
                      setBusy(provider);
                      try {
                        await api(`/connections/${scope}/${provider}`, {
                          method: "DELETE",
                        });
                        await load();
                      } catch (e) {
                        setError((e as Error).message);
                      } finally {
                        setBusy("");
                      }
                    }}
                  >
                    <Unplug size={14} />
                    {t("Ngắt kết nối", "Disconnect")}
                  </button>
                )}
              </div>
              {provider === "paypal" && row && (
                <small className="break-anywhere">
                  Webhook URL:{" "}
                  {typeof window !== "undefined" ? location.origin : ""}
                  /api/v1/payments/webhooks/paypal/{row.id}
                </small>
              )}
            </form>
          );
        })}
      </div>
    </div>
  );
}
