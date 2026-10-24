"use client";
import { useEffect } from "react";
import { Render } from "@puckeditor/core";
import Link from "next/link";
import { makeConfig } from "./page-blocks";
import SiteNavigation from "./site-navigation";
import { useI18n } from "./locale-provider";
import SiteRuntime from "./authoring/site-runtime";
export default function SiteView({
  data,
  pageSlug = "",
}: {
  data: any;
  pageSlug?: string;
}) {
  const { locale, t, setLocale } = useI18n(),
    tenant = data.tenant,
    doc = tenant.published_page,
    isNew = doc?.schema_version === "2.0",
    page = isNew ? doc.pages.find((p: any) => p.slug === pageSlug) : null;
  useEffect(() => {
    if (
      isNew &&
      !document.cookie
        .split(";")
        .some((c) => c.trim().startsWith("yiedu_locale="))
    )
      setLocale(doc.default_locale);
  }, [isNew, doc?.default_locale]);
  return (
    <div
      className="tenant-site"
      style={
        { "--brand": tenant.branding.color || "#215d4c" } as React.CSSProperties
      }
    >
      <SiteNavigation tenant={tenant} document={doc} pageId={page?.id} />
      {isNew ? (
        page ? (
          <SiteRuntime
            key={`${tenant.id}:${page.id}:${locale}`}
            frameUrl={`/api/v1/sites/${encodeURIComponent(tenant.slug)}/render?page=${encodeURIComponent(pageSlug)}&locale=${locale}`}
            source={page[locale].html ? page[locale] : page[doc.default_locale]}
            pages={doc.pages}
            courses={data.courses.map((c: any) => ({
              ...c,
              ...c.translations?.[locale],
            }))}
            slug={tenant.slug}
            title={page.title[locale] || tenant.name}
          />
        ) : (
          <h1>{t("Không tìm thấy trang", "Page not found")}</h1>
        )
      ) : (
        <Render
          config={makeConfig(data.courses, tenant.slug, t)}
          data={doc?.content ? doc : { root: { props: {} }, content: [] }}
        />
      )}
      <footer>
        <span>© {tenant.name}</span>
        <Link href={"/t/" + tenant.slug + "/administrator"}>
          {t("Quản trị hệ thống ↗", "Administration ↗")}
        </Link>
      </footer>
    </div>
  );
}
