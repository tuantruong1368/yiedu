"use client";
import { usePlatform } from "./platform-provider";
import { useI18n, LocaleSwitch } from "./locale-provider";
import Link from "next/link";
import { ArrowUpRight, Layers3, LogOut } from "lucide-react";
import { api } from "@/lib/api";
export function Brand() {
  const branding = usePlatform();

  return (
    <Link href="/" className="brand">
      <img
        className="yiedu-symbol"
        src={branding.logo_url}
        width={42}
        height={42}
        alt=""
      />
      {branding.name}
      <span className="brand-dot">.</span>
    </Link>
  );
}
export function Header() {
  const { t: tr } = useI18n();

  return (
    <header className="topbar">
      <Brand />
      <LocaleSwitch />
      <nav>
        <Link href="/#templates">{tr("Mẫu giao diện")}</Link>
        <Link href="/#pricing">{tr("Bảng giá", "Pricing")}</Link>
        <Link href="/marketplace">{tr("Tiện ích")}</Link>
        <Link href="/developer">{tr("Dành cho developer")}</Link>
      </nav>
      <Link href="/dashboard" className="button small">
        <span className="header-workspace-full">
          {tr("Không gian của tôi")}
        </span>
        <span className="header-workspace-short">
          {tr("Không gian", "Workspace")}
        </span>
        <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
export function ErrorBox({ message }: { message: string }) {
  const { t: tr } = useI18n();

  return message ? (
    <div role="alert" className="error">
      {tr(message)}
    </div>
  ) : null;
}
export function Loading() {
  const { t: tr } = useI18n();

  return (
    <div className="loading">
      <span className="spinner" />
      {tr("Đang tải không gian của bạn…")}
    </div>
  );
}
export function Logout() {
  const { t: tr } = useI18n();

  return (
    <button
      className="button ghost small"
      onClick={async () => {
        await api("/auth/logout", { method: "POST" });
        location.href = "/login";
      }}
    >
      <LogOut size={16} />
      {tr("Đăng xuất")}
    </button>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  const { t: tr } = useI18n();

  return (
    <div className="empty">
      <Layers3 size={30} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
