"use client";
import { useI18n, LocaleSwitch } from "./locale-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Layers3 } from "lucide-react";
import { api } from "@/lib/api";
import { tenantReturnURL, accountReturnURL } from "@/lib/navigation";
import { Brand, ErrorBox } from "./shared";
export default function AuthScreen({
  register = false,
  template = "academy",
  site = "",
  course = "",
  returnTo = "",
}: {
  register?: boolean;
  template?: string;
  site?: string;
  course?: string;
  returnTo?: string;
}) {
  const { t: tr } = useI18n();
  const router = useRouter();

  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api(register ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: f.get("email"),
          password: f.get("password"),
          ...(register ? { name: f.get("name") } : {}),
        }),
      });
      if (site) {
        await api("/sites/" + encodeURIComponent(site) + "/join", {
          method: "POST",
        });
        const destination =
          "/t/" +
          site +
          "/learn" +
          (course ? "?course=" + encodeURIComponent(course) : "");
        router.replace(
          returnTo ? tenantReturnURL(site, returnTo, destination) : destination,
        );
      } else
        router.replace(
          accountReturnURL(
            returnTo,
            "/dashboard?template=" + encodeURIComponent(template),
          ),
        );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  const query =
    "?template=" +
    encodeURIComponent(template) +
    (site ? "&site=" + encodeURIComponent(site) : "") +
    (course ? "&course=" + encodeURIComponent(course) : "") +
    (returnTo ? "&returnTo=" + encodeURIComponent(returnTo) : "");
  return (
    <main className="auth-layout">
      <div className="auth-language">
        <LocaleSwitch />
      </div>
      <aside className="auth-art">
        <Brand />
        <div>
          <span className="eyebrow">
            {tr("MỘT KHÔNG GIAN. KHẢ NĂNG VÔ HẠN.")}
          </span>
          <h1>
            {tr("Trao tri thức.")}
            <br />
            {tr("Mở tương lai.")}
          </h1>
          <p>{tr("Hành trình tạo ra điều có giá trị bắt đầu từ đây.")}</p>
        </div>
        <small>YIEDU / LEARNING WITHOUT LIMITS</small>
        <Layers3 className="auth-watermark" />
      </aside>
      <section className="auth-form">
        <Link className="text-link" href="/">
          {" "}
          <ArrowLeft size={16} />
          {tr("Về trang chủ")}
        </Link>
        <div className="form-box">
          <span className="eyebrow">
            {site
              ? "THAM GIA " + site.toUpperCase()
              : tr("CHÀO MỪNG ĐẾN VỚI YIEDU")}
          </span>
          <h2>
            {register ? tr("Bắt đầu hành trình.") : tr("Chào mừng trở lại.")}
          </h2>
          <p>
            {register
              ? tr("Tạo tài khoản để học tập và xây không gian của bạn.")
              : tr("Đăng nhập để tiếp tục điều bạn đang xây dựng.")}
          </p>
          <form onSubmit={submit}>
            {register && (
              <label>
                {tr("Họ và tên")}
                <input
                  name="name"
                  required
                  maxLength={200}
                  placeholder={tr("Tên của bạn")}
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email
              <input
                name="email"
                type="email"
                required
                placeholder="ban@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              {tr("Mật khẩu")}
              <input
                name="password"
                type="password"
                required
                minLength={10}
                maxLength={128}
                placeholder={tr("Tối thiểu 10 ký tự")}
                autoComplete={register ? "new-password" : "current-password"}
              />
            </label>
            <ErrorBox message={error} />
            <button className="button full" disabled={busy}>
              {busy
                ? tr("Đang xử lý…")
                : register
                  ? tr("Tạo tài khoản")
                  : tr("Đăng nhập")}
              <ArrowRight size={18} />
            </button>
          </form>
          <div className="divider">{tr("ĐĂNG NHẬP MẠNG XÃ HỘI")}</div>
          <div className="social-buttons">
            <button disabled title={tr("Cần cấu hình OAuth")}>
              {tr("Google · chưa cấu hình")}
            </button>
            <button disabled title={tr("Cần cấu hình OAuth")}>
              {tr("Facebook · chưa cấu hình")}
            </button>
          </div>
          <p className="auth-switch">
            {register ? tr("Đã có tài khoản?") : tr("Chưa có tài khoản?")}{" "}
            <Link href={(register ? "/login" : "/register") + query}>
              {register ? tr("Đăng nhập") : tr("Tạo tài khoản")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
