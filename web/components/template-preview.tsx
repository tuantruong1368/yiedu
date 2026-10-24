"use client";
import Link from "next/link";
import { Header } from "./shared";
import TemplateLink from "./template-link";
import SiteRuntime from "./authoring/site-runtime";
import LessonView from "./lesson/lesson-view";
import { useI18n } from "./locale-provider";
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
    template = data.template;
  const page =
    data.document.pages.find((x: any) => x.id === pageId) ||
    data.document.pages[0];
  const localized = data.courses.map((x: any) => ({
    ...x,
    ...x.translations?.[locale],
  }));
  return (
    <>
      <Header />
      <main>
        <section className="workspace">
          <Link href="/#templates">
            ← {t("Thư viện template", "Template library")}
          </Link>
          <h1>{template.name}</h1>
          <p>
            {template.course_count} {t("môn", "courses")} ·{" "}
            {template.lesson_count} {t("bài học", "lessons")} · VI / EN
          </p>
          <p>
            {t(
              "Bản biên soạn cô đọng đang chờ chuyên gia rà soát. Lộ trình tham khảo, không phải chương trình cấp bằng hay cam kết thành thạo.",
              "Compact original learning units awaiting subject review. A reference pathway, not an accredited degree or a mastery guarantee.",
            )}
          </p>
          <TemplateLink template={template.id}>
            {t("Chỉnh sửa website này", "Edit this website")}
          </TemplateLink>
          <nav className="actions">
            {data.document.pages.map((x: any) => (
              <Link key={x.id} href={`/templates/${template.id}?page=${x.id}`}>
                {x.title[locale]}
              </Link>
            ))}
          </nav>
        </section>
        <SiteRuntime
          source={page[locale]}
          pages={data.document.pages}
          courses={localized}
          slug="preview"
          title={template.name}
          courseBase={`/templates/${template.id}?course=`}
          pageBase={`/templates/${template.id}?page=`}
        />
        <section className="workspace" id="lessons">
          <h2>{t("Khám phá bài học thật", "Explore the learning units")}</h2>
          <div className="dashboard-columns">
            <aside>
              {localized.map((x: any) => (
                <p key={x.id}>
                  <Link
                    href={`/templates/${template.id}?course=${x.id}#lessons`}
                  >
                    {x.curriculum_meta.semester
                      ? `${t("Học kỳ", "Semester")} ${x.curriculum_meta.semester} · `
                      : ""}
                    {x.title}
                  </Link>
                </p>
              ))}
            </aside>
            <div>
              <h2>{course.translations?.[locale]?.title || course.title}</h2>
              {lessons.map((x: any, i: number) => (
                <article className="panel" key={i}>
                  <h3>{x.translations?.[locale]?.title || x.title}</h3>
                  <LessonView lesson={{ ...x, id: `${course.id}-${i}` }} />
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
