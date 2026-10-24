"use client";
import Link from "next/link";
import { LogoMark } from "./tenant-brand";
import { LocaleSwitch, useI18n } from "./locale-provider";
import { useId, useState } from "react";
import { Menu, X } from "lucide-react";

/** The same brand, menu and primary action in tenant sites and template previews. */
export default function SiteNavigation({
  tenant,
  document: doc,
  pageId,
  previewBase,
}: {
  tenant: any;
  document: any;
  pageId?: string;
  previewBase?: string;
}) {
  const { locale, t } = useI18n();
  const [expanded, setExpanded] = useState(false),
    menuId = useId();
  const newDoc = doc?.schema_version === "2.0";
  const pageURL = (page: any) =>
    previewBase
      ? `${previewBase}&page=${page.id}`
      : `/t/${tenant.slug}${page.slug ? `/p/${page.slug}` : ""}`;
  const home = newDoc && doc.pages.find((p: any) => !p.slug);
  return (
    <header className={`site-nav ${expanded ? "menu-open" : ""}`}>
      <Link
        className="brand tenant-brand"
        href={home ? pageURL(home) : `/t/${tenant.slug}`}
        scroll={false}
      >
        <LogoMark branding={tenant.branding} name={tenant.name} />
        <span>{tenant.branding?.text || tenant.name}</span>
      </Link>
      <button
        type="button"
        className="site-menu-toggle"
        aria-label={t("Mở menu website", "Open website menu")}
        aria-expanded={expanded}
        aria-controls={menuId}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <X size={20} /> : <Menu size={20} />}
      </button>
      <nav
        id={menuId}
        aria-label={t("Menu website", "Website menu")}
        onClick={() => setExpanded(false)}
      >
        {newDoc ? (
          doc.menu.map((item: any) => {
            const page = doc.pages.find((p: any) => p.id === item.page_id);
            return (
              page && (
                <Link
                  key={item.id}
                  href={pageURL(page)}
                  scroll={false}
                  aria-current={page.id === pageId ? "page" : undefined}
                >
                  {item.label[locale] || item.label[doc.default_locale]}
                </Link>
              )
            );
          })
        ) : (
          <a href="#courses">{t("Khóa học", "Courses")}</a>
        )}
        {!previewBase && (
          <Link href={`/t/${tenant.slug}/learn`}>
            {t("Không gian học tập", "Learning")}
          </Link>
        )}
      </nav>
      {!previewBase && <LocaleSwitch />}
      <Link
        href={
          previewBase ? `${previewBase}#lessons` : `/t/${tenant.slug}/learn`
        }
        className="button small"
      >
        {previewBase
          ? t("Khám phá bài học ↗", "Explore lessons ↗")
          : t("Tham gia học tập ↗", "Start learning ↗")}
      </Link>
    </header>
  );
}
