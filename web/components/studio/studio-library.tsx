"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Clapperboard,
  FileSliders,
  FlaskConical,
  Search,
  ArrowUpRight,
  Trash2,
  Plus,
  Library,
} from "lucide-react";
import { useURLFilters } from "@/lib/use-url-filters";
import { api } from "@/lib/api";
import { StudioAsset, studioURL } from "@/lib/studio/types";
import { studioTools } from "@/lib/studio/registry";
import { ErrorBox } from "../shared";
import { useI18n } from "../locale-provider";

const icons = {
  slides: FileSliders,
  video: Clapperboard,
  simulation: FlaskConical,
};
export default function StudioLibrary({ overview }: { overview: any }) {
  const { t, locale } = useI18n(),
    { params: query, updateFilters } = useURLFilters(),
    pathname = usePathname();
  const [assets, setAssets] = useState<StudioAsset[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState(""),
    [lessonLimit, setLessonLimit] = useState(30);
  const slug = overview.tenant.slug,
    base = `/runtime/${overview.tenant.id}`,
    kind = query.get("studio_kind") || "all",
    search = query.get("studio_q") || "",
    course = query.get("studio_course") || "",
    returnTo = pathname + (query.size ? `?${query}` : ""),
    href = (kind: string, id = "new") => studioURL(slug, kind, id, returnTo),
    labels: Record<string, string> = {
      slides: t("Tạo slide", "Create slides"),
      video: t("Tạo video", "Create video"),
      simulation: t("Tạo mô phỏng", "Create simulation"),
    };
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<StudioAsset[]>(base + "/studio")
      .then((rows) => {
        if (!cancelled) setAssets(rows);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [base]);
  function update(key: string, value: string) {
    updateFilters({ tab: "studio", [key]: value });
  }
  async function remove(asset: StudioAsset) {
    if (
      !confirm(
        t(
          "Xóa dự án? Các bản đã chèn trong bài học vẫn được giữ.",
          "Delete project? Snapshots already embedded in lessons are kept.",
        ),
      )
    )
      return;
    setRemoving(asset.id);
    setError("");
    try {
      await api(`${base}/studio/${asset.id}`, { method: "DELETE" });
      setAssets((rows) => rows.filter((a) => a.id !== asset.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRemoving("");
    }
  }
  const filtered = assets.filter(
      (a) =>
        (kind === "all" || a.kind === kind) &&
        `${a.title} ${a.locale}`
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase()),
    ),
    lessons = overview.lessons.filter(
      (l: any) => !course || l.course_id === course,
    );
  return (
    <section
      className="studio-library embedded-studio"
      aria-label={t("Studio nội dung", "Content Studio")}
    >
      <div className="studio-library-heading">
        <span className="eyebrow">CONTENT WORKSPACE</span>
        <h2>
          {t(
            "Từ ý tưởng đến bài giảng.",
            "From an idea to a learning experience.",
          )}
        </h2>
        <p>
          {t(
            "Chọn công cụ để mở không gian sáng tạo toàn màn hình. Học liệu được lưu riêng và có thể dùng lại trong nhiều bài học.",
            "Choose a tool to open its full-page creative workspace. Save content independently and reuse it across lessons.",
          )}
        </p>
      </div>
      <div className="studio-tool-grid">
        <Link href={href("lesson")} className="studio-tool-card">
          <BookOpen />
          <h2>{t("Bài giảng nâng cao", "Advanced lesson")}</h2>
          <p>
            {t(
              "Kết hợp văn bản, toán học, slide, video và mô phỏng.",
              "Bring text, math, slides, video and simulations together.",
            )}
          </p>
          <span>
            <Plus size={15} />
            {t("Soạn bài", "Compose lesson")}
            <ArrowUpRight size={15} />
          </span>
        </Link>
        {studioTools().map((tool) => {
          const Icon = icons[tool.id];
          return (
            <Link
              key={tool.id}
              href={href(tool.id)}
              className={`studio-tool-card tool-${tool.id}`}
            >
              <Icon />
              <h2>{tool.label[locale]}</h2>
              <p>{tool.description[locale]}</p>
              <span>
                <Plus size={15} />
                {labels[tool.id]}
                <ArrowUpRight size={15} />
              </span>
            </Link>
          );
        })}
      </div>
      <ErrorBox message={error} />
      <div className="studio-library-controls">
        <div>
          <h2>
            {t("Thư viện dự án", "Project library")}{" "}
            <small>({assets.length})</small>
          </h2>
          <p>
            {t(
              "Học liệu của bạn, sẵn sàng cho bài giảng tiếp theo.",
              "Your reusable materials, ready for the next lesson.",
            )}
          </p>
        </div>
        <label className="studio-library-search">
          <Search size={16} />
          <input
            type="search"
            aria-label={t("Tìm dự án", "Search projects")}
            placeholder={t("Tìm trong thư viện…", "Search your library…")}
            value={search}
            onChange={(e) => update("studio_q", e.target.value)}
          />
        </label>
      </div>
      <div
        className="studio-kind-tabs"
        aria-label={t("Lọc loại học liệu", "Filter learning materials")}
      >
        {[
          ["all", t("Tất cả", "All")],
          ...studioTools().map((x) => [x.id, x.label[locale]]),
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={kind === id}
            onClick={() => update("studio_kind", id)}
          >
            {label}
            <span>
              {id === "all"
                ? assets.length
                : assets.filter((a) => a.kind === id).length}
            </span>
          </button>
        ))}
      </div>
      {loading ? (
        <div
          className="studio-library-skeleton"
          role="status"
          aria-label={t("Đang tải thư viện", "Loading library")}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="studio-project-grid">
            {filtered.map((a) => {
              const Icon = icons[a.kind];
              return (
                <article key={a.id}>
                  <div className={`studio-project-symbol tool-${a.kind}`}>
                    <Icon size={22} />
                    <small>
                      {a.locale.toUpperCase()} · v{a.revision}
                    </small>
                  </div>
                  <h3>
                    <Link href={href(a.kind, a.id)}>{a.title}</Link>
                  </h3>
                  <small>
                    {studioTools().find((x) => x.id === a.kind)?.label[locale]}
                  </small>
                  <div className="actions">
                    <Link className="text-link" href={href(a.kind, a.id)}>
                      {t("Mở dự án", "Open project")}
                      <ArrowUpRight size={14} />
                    </Link>
                    <button
                      type="button"
                      aria-label={`${t("Xóa", "Delete")} ${a.title}`}
                      disabled={!!removing}
                      onClick={() => remove(a)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {!filtered.length && (
            <div className="studio-library-empty">
              <Library size={29} />
              <h3>
                {assets.length
                  ? t("Chưa có kết quả phù hợp", "No matching projects")
                  : t(
                      "Thư viện đang chờ ý tưởng đầu tiên.",
                      "Your library is ready for its first idea.",
                    )}
              </h3>
              <p>
                {assets.length
                  ? t(
                      "Đổi bộ lọc hoặc từ khóa để tìm học liệu.",
                      "Try a different filter or keyword.",
                    )
                  : t(
                      "Chọn Tạo slide, Tạo video hoặc Tạo mô phỏng ở phía trên.",
                      "Choose Create slides, Create video or Create simulation above.",
                    )}
              </p>
            </div>
          )}
        </>
      )}
      <section className="studio-lesson-library">
        <div className="studio-library-controls">
          <div>
            <h2>{t("Bài giảng trong hệ thống", "Lessons in your academy")}</h2>
            <p>
              {lessons.length}{" "}
              {t(
                "bài học có thể mở trong editor nâng cao",
                "lessons available in the advanced editor",
              )}
            </p>
          </div>
          <label>
            {t("Lọc theo khóa học", "Filter by course")}
            <select
              value={course}
              onChange={(e) => {
                update("studio_course", e.target.value);
                setLessonLimit(30);
              }}
            >
              <option value="">{t("Tất cả khóa học", "All courses")}</option>
              {overview.courses.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.translations?.[locale]?.title || c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        {lessons.slice(0, lessonLimit).map((l: any) => (
          <Link
            className="studio-lesson-row"
            key={l.id}
            href={href("lesson", l.id)}
          >
            <BookOpen size={17} />
            <span>
              {l.localized_titles?.[locale] || l.title}
              <small>
                {overview.courses.find((c: any) => c.id === l.course_id)?.title}
              </small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        ))}
        {!lessons.length && (
          <p className="studio-library-empty">
            {t(
              "Chưa có bài giảng trong lựa chọn này. Nhấn Soạn bài để bắt đầu.",
              "No lessons in this selection. Choose Compose lesson to begin.",
            )}
          </p>
        )}
        {lessons.length > lessonLimit && (
          <button
            className="button ghost small"
            type="button"
            onClick={() => setLessonLimit((n) => n + 30)}
          >
            {t("Xem thêm bài giảng", "Show more lessons")}
          </button>
        )}
      </section>
    </section>
  );
}
