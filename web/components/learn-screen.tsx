"use client";
import { useI18n } from "./locale-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Route,
  ArrowLeft,
  ArrowRight,
  Award,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import { ErrorBox, Loading, Empty, Logout } from "./shared";
import { TenantBrand } from "./tenant-brand";
import { LocaleSwitch } from "./locale-provider";
import LessonView from "./lesson/lesson-view";
export default function LearnScreen({ slug }: { slug: string }) {
  const { t: tr, locale } = useI18n();

  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [courseId, setCourseId] = useState(""),
    [lesson, setLesson] = useState<any>(null),
    [certificate, setCertificate] = useState<any>(null);
  const [tenant, setTenant] = useState<any>({ slug, name: slug, branding: {} });
  async function refresh() {
    const site = await api("/sites/" + slug);
    setTenant(site.tenant);
    return api("/runtime/" + site.tenant.id + "/overview").then(setData);
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [slug]);
  async function call(fn: () => Promise<any>) {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const base = data ? "/runtime/" + data.tenant.id : "";
  return (
    <>
      <header className="topbar">
        <TenantBrand tenant={data?.tenant || tenant} />
        <LocaleSwitch />
        <Logout />
      </header>
      {!data ? (
        <div className="workspace">
          <ErrorBox message={error} />
          {error ? (
            <div className="empty">
              <h2>{tr("Tham gia không gian học tập.")}</h2>
              <p>
                {tr("Đăng nhập hoặc tạo tài khoản để tham gia")}
                {slug}.
              </p>
              <div className="actions">
                <Link className="button" href={"/register?site=" + slug}>
                  {tr("Tạo tài khoản")}
                </Link>
                <Link className="button ghost" href={"/login?site=" + slug}>
                  {tr("Đăng nhập")}
                </Link>
              </div>
            </div>
          ) : (
            <Loading />
          )}
        </div>
      ) : (
        <main className="workspace">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{data.tenant.name}</span>
              <h1>
                {tr("Hôm nay, học điều mới")}
                <span className="brand-dot">.</span>
              </h1>
              <p>{tr("Mỗi bước nhỏ đều đưa bạn đến gần mục tiêu hơn.")}</p>
            </div>
            <Link href={"/t/" + slug} className="text-link">
              {tr("Website hệ thống ↗")}
            </Link>
          </div>
          <ErrorBox message={error} />
          {certificate && (
            <section className="certificate">
              <Award size={48} />
              <span className="eyebrow">{tr("CHỨNG NHẬN HOÀN THÀNH")}</span>
              <h2>{certificate.learner}</h2>
              <p>{tr("đã hoàn thành khóa học")}</p>
              <h3>{certificate.course}</h3>
              <p>{certificate.school}</p>
              <small>
                {tr("Mã tham chiếu:")}
                {certificate.reference}
              </small>
              <div className="actions">
                <button className="button" onClick={() => window.print()}>
                  {tr("In chứng nhận")}
                </button>
                <button
                  className="button ghost"
                  onClick={() => setCertificate(null)}
                >
                  {tr("Đóng")}
                </button>
              </div>
            </section>
          )}
          {lesson ? (
            <div className="learning-layout">
              <aside className="panel">
                <button className="text-link" onClick={() => setLesson(null)}>
                  <ArrowLeft size={15} />
                  {tr("Danh sách khóa học")}
                </button>
                <h2>
                  {
                    data.courses.find((c: any) => c.id === lesson.course_id)
                      ?.title
                  }
                </h2>
                {data.lessons
                  .filter((l: any) => l.course_id === lesson.course_id)
                  .map((l: any) => (
                    <button
                      key={l.id}
                      className={
                        "lesson-nav " + (l.id === lesson.id ? "active" : "")
                      }
                      onClick={() =>
                        call(async () =>
                          setLesson(await api(base + "/lessons/" + l.id)),
                        )
                      }
                    >
                      {data.completed.includes(l.id) ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <PlayCircle size={17} />
                      )}
                      <span>{l.title}</span>
                    </button>
                  ))}
              </aside>
              <article className="panel lesson-content">
                <span className="eyebrow">{tr("BÀI HỌC")}</span>
                <h1>{lesson.translations?.[locale]?.title || lesson.title}</h1>
                {lesson.video_url && (
                  <video controls preload="metadata" src={lesson.video_url} />
                )}
                <LessonView lesson={lesson} />
                <button
                  className="button"
                  onClick={() =>
                    call(async () => {
                      await api(base + "/lessons/" + lesson.id + "/complete", {
                        method: "POST",
                      });
                      await refresh();
                    })
                  }
                >
                  <CheckCircle2 size={18} />
                  {data.completed.includes(lesson.id)
                    ? tr("Đã hoàn thành")
                    : tr("Đánh dấu hoàn thành")}
                </button>
              </article>
            </div>
          ) : (
            <>
              {data.paths.length > 0 && (
                <section className="panel">
                  <span className="eyebrow">{tr("HÀNH TRÌNH CỦA BẠN")}</span>
                  <h2>{tr("Lộ trình học tập")}</h2>
                  {data.paths.map((p: any) => (
                    <div className="learning-path" key={p.id}>
                      <b>
                        <Route size={18} />
                        {p.title}
                      </b>
                      <div>
                        {p.course_ids.map((id: string, i: number) => (
                          <button key={id} onClick={() => setCourseId(id)}>
                            <span>{i + 1}</span>
                            {data.courses.find((c: any) => c.id === id)
                              ?.title || tr("Khóa học chưa xuất bản")}
                            <ArrowRight size={15} />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
              <div className="section-title spaced">
                <h2>{tr("Khóa học dành cho bạn")}</h2>
                {courseId && (
                  <button className="text-link" onClick={() => setCourseId("")}>
                    {tr("Xem tất cả")}
                  </button>
                )}
              </div>
              <div className="course-grid">
                {data.courses
                  .filter((c: any) => !courseId || c.id === courseId)
                  .map((c: any, i: number) => {
                    const enrolled = data.enrolled.includes(c.id),
                      lessons = data.lessons.filter(
                        (l: any) => l.course_id === c.id,
                      ),
                      done = lessons.filter((l: any) =>
                        data.completed.includes(l.id),
                      ).length;
                    return (
                      <article className="course-card" key={c.id}>
                        <div className={"course-art art-" + (i % 3)}>
                          <BookOpen size={44} />
                          <span>0{i + 1}</span>
                        </div>
                        <div>
                          <small>
                            {enrolled ? tr("ĐANG HỌC") : tr("SẴN SÀNG BẮT ĐẦU")}
                          </small>
                          <h3>{c.title}</h3>
                          <p>{c.description}</p>
                          {enrolled ? (
                            <>
                              <div className="progress-track">
                                <i
                                  style={{
                                    width:
                                      (lessons.length
                                        ? (done / lessons.length) * 100
                                        : 0) + "%",
                                  }}
                                />
                              </div>
                              <small>
                                {done}/{lessons.length}
                                {tr("bài học hoàn thành")}
                              </small>
                              <div className="lesson-buttons">
                                {lessons.map((l: any) => (
                                  <button
                                    className="lesson-nav"
                                    key={l.id}
                                    onClick={() =>
                                      call(async () =>
                                        setLesson(
                                          await api(base + "/lessons/" + l.id),
                                        ),
                                      )
                                    }
                                  >
                                    {data.completed.includes(l.id) ? (
                                      <CheckCircle2 size={17} />
                                    ) : (
                                      <PlayCircle size={17} />
                                    )}{" "}
                                    {l.title}
                                  </button>
                                ))}
                              </div>
                              {lessons.length > 0 &&
                                done === lessons.length && (
                                  <button
                                    className="button ghost small"
                                    onClick={() =>
                                      call(async () =>
                                        setCertificate(
                                          await api(
                                            base +
                                              "/courses/" +
                                              c.id +
                                              "/certificate",
                                          ),
                                        ),
                                      )
                                    }
                                  >
                                    <Award size={16} />
                                    {tr("Chứng nhận")}
                                  </button>
                                )}
                            </>
                          ) : (
                            <button
                              className="button"
                              onClick={() =>
                                call(async () => {
                                  await api(
                                    base + "/courses/" + c.id + "/enroll",
                                    { method: "POST" },
                                  );
                                  await refresh();
                                })
                              }
                            >
                              {tr("Ghi danh miễn phí")}
                              <ArrowRight size={17} />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
              {!data.courses.length && (
                <Empty
                  title={tr("Khóa học đang được chuẩn bị")}
                  body={tr(
                    "Hãy quay lại sau khi giảng viên xuất bản nội dung.",
                  )}
                />
              )}
            </>
          )}
        </main>
      )}
    </>
  );
}
