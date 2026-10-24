"use client";
import { useI18n, LocaleSwitch } from "./locale-provider";
import Link from "next/link";
import { ArrowUpRight, Layers3, LogOut } from "lucide-react";
import { api } from "@/lib/api";
export function Brand() {
  const { t: tr } = useI18n();

  return (
    <Link href="/" className="brand">
      <span className="brand-icon">
        <Layers3 size={22} />
      </span>
      YiEdu<span className="brand-dot">.</span>
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
        <Link href="/marketplace">{tr("Tiện ích")}</Link>
        <Link href="/developer">{tr("Dành cho developer")}</Link>
      </nav>
      <Link href="/dashboard" className="button small">
        {tr("Không gian của tôi")}
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
