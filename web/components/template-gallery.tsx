"use client";
import { useState } from "react";
import Link from "next/link";
import TemplateThumbnail from "./template-thumbnail";
import TemplateLink from "./template-link";
import { useI18n } from "./locale-provider";
export default function TemplateGallery({ templates }: { templates: any[] }) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const visible = templates.filter((x) =>
    `${x.name} ${x.category} ${x.category_en} ${x.description} ${x.description_en}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <label>
        {t("Tìm template theo mục đích", "Find a template by purpose")}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t(
            "Robot, giáo viên, doanh nghiệp…",
            "Robot, teacher, business…",
          )}
        />
      </label>
      <p>
        {t(
          "Mỗi mẫu có 5 trang, bài học và lộ trình chỉnh sửa được.",
          "Each template includes 5 pages, editable lessons and pathways.",
        )}
      </p>
      <div className="template-grid">
        {visible.map((x) => (
          <article className="template-card" key={x.id}>
            <Link
              href={`/templates/${x.id}`}
              aria-label={`${t("Xem website", "Preview website")} ${x.name}`}
            >
              <TemplateThumbnail id={x.id} name={x.name} />
            </Link>
            <div className="template-info" style={{ display: "block" }}>
              <small>{locale === "en" ? x.category_en : x.category}</small>
              <h2>{x.name}</h2>
              <p>{locale === "en" ? x.description_en : x.description}</p>
              <p>
                {x.course_count} {t("môn", "courses")} · {x.lesson_count}{" "}
                {t("bài học", "lessons")}
              </p>
              <Link href={`/templates/${x.id}`} className="text-link">
                {t("Xem website và bài học", "Preview website and lessons")} ↗
              </Link>
              <TemplateLink template={x.id}>
                {t("Dùng mẫu này", "Use this template")}
              </TemplateLink>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p>{t("Không tìm thấy mẫu phù hợp.", "No matching templates.")}</p>
      )}
    </>
  );
}
