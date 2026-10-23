"use client";
import Link from "next/link";
import { ArrowUpRight, Layers3, LogOut } from "lucide-react";
import { api } from "@/lib/api";
export function Brand() {
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
  return (
    <header className="topbar">
      <Brand />
      <nav>
        <Link href="/#templates">Mẫu giao diện</Link>
        <Link href="/marketplace">Tiện ích</Link>
        <Link href="/developer">Dành cho developer</Link>
      </nav>
      <Link href="/dashboard" className="button small">
        Không gian của tôi <ArrowUpRight size={16} />
      </Link>
    </header>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="error">
      {message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading">
      <span className="spinner" /> Đang tải không gian của bạn…
    </div>
  );
}
export function Logout() {
  return (
    <button
      className="button ghost small"
      onClick={async () => {
        await api("/auth/logout", { method: "POST" });
        location.href = "/login";
      }}
    >
      <LogOut size={16} /> Đăng xuất
    </button>
  );
}
export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <Layers3 size={30} />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
