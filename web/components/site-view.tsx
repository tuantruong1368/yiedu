"use client";
import { Render } from "@puckeditor/core";
import Link from "next/link";
import { makeConfig } from "./page-blocks";
export default function SiteView({ data }: { data: any }) {
  const t = data.tenant;
  return (
    <div
      className="tenant-site"
      style={
        { "--brand": t.branding.color || "#215d4c" } as React.CSSProperties
      }
    >
      <header className="site-nav">
        <Link href={"/t/" + t.slug} className="brand">
          {t.name}
          <span className="brand-dot">.</span>
        </Link>
        <nav>
          <a href="#courses">Khóa học</a>
          <Link href={"/t/" + t.slug + "/learn"}>Không gian học tập</Link>
        </nav>
        <Link href={"/register?site=" + t.slug} className="button small">
          Tham gia học tập ↗
        </Link>
      </header>
      <Render
        config={makeConfig(data.courses, t.slug)}
        data={
          t.published_page?.content
            ? t.published_page
            : { root: { props: {} }, content: [] }
        }
      />
      <footer>
        <span>© {t.name}</span>
        <span>Được vận hành cùng YiEdu</span>
        <Link href={"/t/" + t.slug + "/administrator"}>
          Quản trị hệ thống ↗
        </Link>
      </footer>
    </div>
  );
}
