"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import TemplateLink from "./template-link";
import SiteRuntime from "./authoring/site-runtime";
import SiteNavigation from "./site-navigation";
import LessonView from "./lesson/lesson-view";
import { LocaleSwitch, useI18n } from "./locale-provider";
import { galleryReturnURL } from "@/lib/navigation";

export default function TemplatePreview({
  data,
  lessons,
  course,
  pageId,
}: {
  data: any;
  lessons: any[];
  course: any;
  pageId: string;
}) {
  const { locale, t } = useI18n(),
    router = useRouter(),
    query = useSearchParams();
  const [device, setDevice] = useState("desktop"),
    [lessonIndex, setLessonIndex] = useState(0);
  useEffect(() => setLessonIndex(0), [course.id]);
  const template = data.template,
    doc = data.document,
    page =
      doc.pages.find((x: any) => x.id === pageId || x.slug === pageId) ||
      doc.pages[0],
    returnTo = galleryReturnURL(query.get("returnTo")),
    previewBase = `/templates/${template.id}?returnTo=${encodeURIComponent(returnTo)}`,
    localized = data.courses.map((x: any) => ({
      ...x,
      ...x.translations?.[locale],
    })),
    tenant = { name: template.name, slug: "preview", branding: doc.branding },
    activeLesson = lessons[lessonIndex] || lessons[0];
  function navigate(href: string) {
    const url = new URL(href, location.origin);
    if (url.pathname === `/templates/${template.id}`) {
      url.searchParams.set("returnTo", returnTo);
      if (!url.searchParams.has("page") && url.searchParams.has("course"))
        url.searchParams.set("page", page.id);
      router.push(url.pathname + url.search + url.hash, { scroll: !!url.hash });
    } else if (url.origin === location.origin)
      router.push(url.pathname + url.search + url.hash);
    else location.assign(href);
  }
  return (
    <div className="template-preview-page">
      <header className="template-preview-toolbar">
        <Link href={returnTo} className="preview-back">
          <ArrowLeft size={17} />
          <span>{t("Thư viện template", "Template library")}</span>
        </Link>
        <div className="preview-template-title">
          <small>{t("XEM TRƯỚC WEBSITE", "WEBSITE PREVIEW")}</small>
          <h1>{template.name}</h1>
        </div>
        <div
          className="preview-device-switch"
          aria-label={t("Kích thước xem trước", "Preview size")}
        >
          {[
            ["desktop", Monitor, "Desktop"],
            ["tablet", Tablet, "Tablet"],
            ["mobile", Smartphone, "Mobile"],
          ].map(([id, Icon, label]: any) => (
            <button
              key={id}
              type="button"
              aria-label={label}
              aria-pressed={device === id}
              onClick={() => setDevice(id)}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>
        <LocaleSwitch />
        <TemplateLink template={template.id}>
          {t("Chỉnh sửa website này", "Edit this website")}
          <ArrowUpRight size={16} />
        </TemplateLink>
      </header>
      <div className="template-preview-status">
        <span>
          <Check size={13} />
          {t(
            "Giao diện thật · Nội dung chỉnh sửa được",
            "Real website · Fully editable content",
          )}
        </span>
        <a href="#lessons">
          <BookOpen size={13} />
          {template.course_count} {t("chuyên đề", "courses")} ·{" "}
          {template.lesson_count} {t("bài học", "lessons")}
        </a>
      </div>
      <main>
        <div
          className={`template-preview-viewport device-${device}`}
          style={{ "--brand": doc.branding.color } as React.CSSProperties}
        >
          <SiteNavigation
            tenant={tenant}
            document={doc}
            pageId={page.id}
            previewBase={previewBase}
          />
          <SiteRuntime
            frameUrl={`/api/v1/catalog/templates/${template.id}/render?page=${page.id}&locale=${locale}`}
            source={page[locale]}
            pages={doc.pages}
            courses={localized}
            slug="preview"
            title={template.name}
            onNavigate={navigate}
          />
          <footer className="preview-site-footer">
            <span>© {template.name}</span>
            <Link href={`${previewBase}#lessons`}>
              {t("Khám phá chương trình", "Explore the curriculum")} ↗
            </Link>
          </footer>
        </div>
        <section className="preview-curriculum" id="lessons">
          <div className="section-heading">
            <div>
              <span className="eyebrow">LEARNING EXPERIENCE</span>
              <h2>
                {t("Khám phá bài học thật", "Explore the learning units")}
              </h2>
            </div>
            <p>
              VI / EN ·{" "}
              {t(
                "Học liệu được sao chép riêng khi tạo hệ thống",
                "Your own copy when you create an academy",
              )}
            </p>
          </div>
          <div className="preview-learning-grid">
            <aside
              className="preview-course-list"
              aria-label={t("Chuyên đề trong mẫu", "Template courses")}
            >
              {localized.map((x: any, i: number) => (
                <Link
                  key={x.id}
                  href={`${previewBase}&page=${page.id}&course=${x.id}#lessons`}
                  scroll={false}
                  aria-current={course.id === x.id ? "true" : undefined}
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{x.title}</strong>
                    <small>
                      {x.lesson_count} {t("bài học", "lessons")}
                    </small>
                  </div>
                </Link>
              ))}
            </aside>
            <div className="preview-lesson-workspace">
              <h2>{course.translations?.[locale]?.title || course.title}</h2>
              <div
                className="preview-lesson-tabs"
                aria-label={t("Chọn bài học", "Choose a lesson")}
              >
                {lessons.map((x: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={lessonIndex === i}
                    onClick={() => setLessonIndex(i)}
                  >
                    <span>{i + 1}</span>
                    {x.translations?.[locale]?.title || x.title}
                  </button>
                ))}
              </div>
              {activeLesson && (
                <article className="panel">
                  <h3>
                    {activeLesson.translations?.[locale]?.title ||
                      activeLesson.title}
                  </h3>
                  <LessonView
                    hideHeading
                    lesson={{
                      ...activeLesson,
                      id: `${course.id}-${lessonIndex}`,
                    }}
                  />
                </article>
              )}
            </div>
          </div>
          <details className="preview-content-note">
            <summary>
              {t(
                "Về học liệu và nguồn video",
                "About the learning materials and video sources",
              )}
            </summary>
            <p>
              {template.id === "yoga-studio"
                ? t(
                    "Giáo trình nhập môn tự biên soạn, kèm video tiếng Anh từ Yoga With Adriene và hướng dẫn bằng tiếng Việt/Anh. Video thuộc tác giả nguồn, có liên kết gốc. Đây là nội dung thực hành tổng quát; người có chấn thương, bệnh nền hoặc đang mang thai cần hướng dẫn phù hợp trước khi tập.",
                    "Original introductory lessons with English-language Yoga With Adriene videos and Vietnamese/English practice notes. Videos belong to their creators and link to the original source. This is general practice; injuries, health conditions or pregnancy require appropriate individual guidance.",
                  )
                : t(
                    "Bài học tự biên soạn có thực hành và tài liệu tham khảo. Cần chuyên gia rà soát trước khi dùng làm chương trình chính thức; không phải chương trình cấp bằng.",
                    "Original learning units include practice and references. Subject review is needed before formal teaching; this is not an accredited degree program.",
                  )}
            </p>
          </details>
        </section>
      </main>
    </div>
  );
}
