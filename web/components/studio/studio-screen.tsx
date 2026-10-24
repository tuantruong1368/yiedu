"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Clapperboard,
  FileSliders,
  FlaskConical,
  Library,
  Save,
  Eye,
  X,
  Download,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  defaultProject,
  Presentation,
  ProjectData,
  ProjectKind,
  StudioAsset,
  studioURL,
} from "@/lib/studio/types";
import { studioTools } from "@/lib/studio/registry";
import {
  download,
  exportVideo,
  printSlides,
  slideHTML,
} from "@/lib/studio/export";
import LessonEditor from "../lesson/lesson-editor";
import LessonView from "../lesson/lesson-view";
import ProjectEditor from "./project-editor";
import { TenantBrand } from "../tenant-brand";
import { ErrorBox, Loading } from "../shared";
import { LocaleSwitch, useI18n } from "../locale-provider";

export default function StudioScreen({
  slug,
  kind,
  projectId,
}: {
  slug: string;
  kind?: string;
  projectId?: string;
}) {
  const { t, locale } = useI18n(),
    router = useRouter(),
    query = useSearchParams();
  const [overview, setOverview] = useState<any>(null),
    [assets, setAssets] = useState<StudioAsset[]>([]),
    [current, setCurrent] = useState<any>(null),
    [title, setTitle] = useState(""),
    [project, setProject] = useState<ProjectData | null>(null),
    [docs, setDocs] = useState<any>(null),
    [course, setCourse] = useState(""),
    [position, setPosition] = useState(0),
    [videoURL, setVideoURL] = useState(""),
    [contentLocale, setContentLocale] = useState<"vi" | "en">("vi"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false),
    [saving, setSaving] = useState(false),
    [preview, setPreview] = useState(false),
    [filter, setFilter] = useState(""),
    [editor, setEditor] = useState<any>(null),
    [find, setFind] = useState(""),
    [draft, setDraft] = useState<any>(null),
    [draftKey, setDraftKey] = useState(""),
    [editorKey, setEditorKey] = useState(0),
    [recording, setRecording] = useState<number | null>(null),
    [microphone, setMicrophone] = useState(false),
    [wide, setWide] = useState(false);
  const docFingerprint = useRef<string | null>(null),
    abort = useRef<AbortController | null>(null),
    saveRef = useRef<() => void>(() => {});
  const latestDraft = useRef<any>(null);
  latestDraft.current = {
    dirty,
    title,
    project,
    docs,
    course,
    position,
    videoURL,
    contentLocale,
    revision: current?.revision,
    savedAt: new Date().toISOString(),
  };
  useEffect(
    () => () => {
      if (latestDraft.current?.dirty && draftKey) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(latestDraft.current));
        } catch {}
      }
    },
    [draftKey],
  );
  const base = overview ? `/runtime/${overview.tenant.id}` : "";
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      setOverview(null);
      setDirty(false);
      setDocs(null);
      setCurrent(null);
      setProject(null);
      docFingerprint.current = null;
      setPreview(false);
      const [site, user] = await Promise.all([
        api(`/sites/${slug}`),
        api("/auth/me"),
      ]);
      const b = `/runtime/${site.tenant.id}`,
        o = await api(`${b}/overview`);
      if (!["owner", "admin", "instructor"].includes(o.role))
        throw new Error(
          t(
            "Studio dành cho giảng viên và quản trị viên.",
            "Studio requires instructor or administrator access.",
          ),
        );
      const library = await api<StudioAsset[]>(`${b}/studio`);
      let row: any = null;
      if (kind && projectId !== "new")
        row = await api(
          kind === "lesson"
            ? `${b}/lessons/${projectId}`
            : `${b}/studio/${projectId}`,
        );
      if (row && kind !== "lesson" && row.kind !== kind)
        throw new Error(t("Sai loại dự án.", "Project kind mismatch."));
      if (cancelled) return;
      setOverview(o);
      setAssets(library);
      setCurrent(row);
      setTitle(row?.title || t("Bài giảng mới", "New learning project"));
      setProject(
        kind && kind !== "lesson"
          ? row?.data || defaultProject(kind as ProjectKind)
          : null,
      );
      setCourse(
        row?.course_id || query.get("course") || o.courses[0]?.id || "",
      );
      setPosition(row?.position || 0);
      setVideoURL(row?.video_url || "");
      setContentLocale(row?.locale || locale);
      const key = `studio-draft:${user.id}:${site.tenant.id}:${kind}:${projectId}`;
      setDraftKey(key);
      const cached = localStorage.getItem(key);
      setDraft(cached ? JSON.parse(cached) : null);
    })().catch((e) => {
      if (!cancelled) setError(e.message);
    });
    return () => {
      cancelled = true;
      abort.current?.abort();
    };
  }, [slug, kind, projectId]);
  useEffect(() => {
    if (!dirty) return;
    const prevent = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!dirty || !draftKey || !kind) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            title,
            project,
            docs,
            course,
            position,
            videoURL,
            contentLocale,
            revision: current?.revision,
            savedAt: new Date().toISOString(),
          }),
        );
      } catch {
        setNotice(
          t(
            "Không đủ chỗ lưu bản nháp trình duyệt. Hãy lưu vào hệ thống.",
            "Browser draft storage is full. Save to the server.",
          ),
        );
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [
    dirty,
    title,
    project,
    docs,
    course,
    position,
    videoURL,
    contentLocale,
    draftKey,
  ]);
  const changeDocs = useCallback((value: any) => {
    const next = JSON.stringify(value);
    setDocs(value);
    if (docFingerprint.current !== null && next !== docFingerprint.current)
      setDirty(true);
    docFingerprint.current = next;
  }, []);
  async function save() {
    if (!kind || saving || !title.trim()) return;
    setSaving(true);
    setError("");
    try {
      let row;
      if (kind === "lesson") {
        if (!course)
          throw new Error(
            t(
              "Hãy tạo/chọn khóa học trước.",
              "Create or select a course first.",
            ),
          );
        const payload = {
          title,
          position,
          video_url: videoURL,
          content: docs?.vi?.content ?? current?.content ?? "",
          document: docs?.vi?.document ?? current?.document ?? null,
          translations: docs ? { en: docs.en } : current?.translations || {},
          revision: current?.revision,
        };
        row = await api(
          current
            ? `${base}/lessons/${current.id}`
            : `${base}/courses/${course}/lessons`,
          { method: current ? "PUT" : "POST", body: JSON.stringify(payload) },
        );
      } else
        row = await api(`${base}/studio${current ? `/${current.id}` : ""}`, {
          method: current ? "PUT" : "POST",
          body: JSON.stringify({
            title,
            kind,
            locale: contentLocale,
            data: project,
            revision: current?.revision,
          }),
        });
      localStorage.removeItem(draftKey);
      setDraft(null);
      setDirty(false);
      setCurrent(row);
      setNotice(t("Đã lưu vào hệ thống.", "Saved to the server."));
      if (projectId === "new") router.replace(studioURL(slug, kind, row.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }
  saveRef.current = save;
  function restoreDraft() {
    if (!draft) return;
    setTitle(draft.title);
    setProject(draft.project);
    setCourse(draft.course);
    setPosition(draft.position);
    setVideoURL(draft.videoURL);
    setContentLocale(draft.contentLocale || locale);
    if (kind === "lesson" && draft.docs) {
      setCurrent((c: any) => ({
        ...c,
        content: draft.docs.vi.content,
        document: draft.docs.vi.document,
        translations: { en: draft.docs.en },
      }));
      setDocs(draft.docs);
      docFingerprint.current = null;
      setEditorKey((k) => k + 1);
    }
    setDraft(null);
    setDirty(true);
  }
  function embed(asset: StudioAsset) {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: "studioAsset",
          attrs: {
            kind: asset.kind,
            title: asset.title,
            payload: structuredClone(asset.data),
          },
        },
        { type: "paragraph" },
      ])
      .run();
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
    try {
      await api(`${base}/studio/${asset.id}`, { method: "DELETE" });
      setAssets((a) => a.filter((x) => x.id !== asset.id));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const lessonPreview = {
    ...current,
    id: current?.id || "draft",
    title,
    content: docs?.vi.content || current?.content,
    document: docs?.vi.document || current?.document,
    translations: docs ? { en: docs.en } : current?.translations,
  };
  const icons = {
    slides: FileSliders,
    video: Clapperboard,
    simulation: FlaskConical,
  };
  return (
    <div
      className={`studio-shell content-studio ${wide ? "studio-wide" : ""}`}
      aria-busy={saving}
      inert={saving}
    >
      <header className="studio-header">
        <div className="studio-identity">
          {overview ? (
            <TenantBrand tenant={overview.tenant} />
          ) : (
            <strong>Content Studio</strong>
          )}
          <span className="studio-divider" />{" "}
          <Link href={studioURL(slug)}>
            <Library size={17} /> {t("Studio nội dung", "Content Studio")}
          </Link>
        </div>
        <div className="actions">
          <LocaleSwitch />
          <Link
            href={
              kind === "lesson" && current?.course_id
                ? `/t/${slug}/administrator?tab=courses&course=${current.course_id}&lesson=${current.id}`
                : `/t/${slug}/administrator`
            }
            onClick={(e) => {
              if (
                dirty &&
                !confirm(
                  t(
                    "Rời studio? Bản nháp trình duyệt vẫn được giữ.",
                    "Leave studio? Your browser draft is kept.",
                  ),
                )
              )
                e.preventDefault();
            }}
          >
            <ArrowLeft size={16} />
            {t("Quản trị", "Administration")}
          </Link>
        </div>
      </header>
      <ErrorBox message={error} />
      {notice && (
        <p className="studio-notice" role="status">
          {notice}
        </p>
      )}
      {!overview ? (
        <>
          {!error ? (
            <Loading />
          ) : (
            <div className="empty">
              <Link href={`/login?site=${slug}`} className="button">
                {t("Đăng nhập", "Sign in")}
              </Link>
            </div>
          )}
        </>
      ) : !kind ? (
        <main className="studio-library">
          <div className="studio-library-heading">
            <span className="eyebrow">CONTENT WORKSPACE</span>
            <h1>
              {t(
                "Từ ý tưởng đến bài giảng.",
                "From an idea to a learning experience.",
              )}
            </h1>
            <p>
              {t(
                "Soạn độc lập. Tái sử dụng trong nhiều bài học. Mọi nội dung thuộc hệ thống của bạn.",
                "Create independently. Reuse in multiple lessons. Your content belongs to your academy.",
              )}
            </p>
          </div>
          <div className="studio-tool-grid">
            <Link href={studioURL(slug, "lesson")} className="studio-tool-card">
              <BookOpen />
              <h2>{t("Bài giảng nâng cao", "Advanced lesson")}</h2>
              <p>
                {t(
                  "Văn bản, toán học, bảng, slide, video và mô phỏng trong một bài học.",
                  "Text, math, tables, slides, video and simulations in one lesson.",
                )}
              </p>
              <span>+ {t("Soạn bài", "Compose lesson")}</span>
            </Link>
            {studioTools().map((tool) => {
              const Icon = icons[tool.id];
              return (
                <Link
                  key={tool.id}
                  href={studioURL(slug, tool.id)}
                  className={`studio-tool-card tool-${tool.id}`}
                >
                  <Icon />
                  <h2>{tool.label[locale]}</h2>
                  <p>{tool.description[locale]}</p>
                  <span>+ {t("Tạo dự án", "Create project")}</span>
                </Link>
              );
            })}
          </div>
          <div className="section-title">
            <h2>
              {t("Thư viện dự án", "Project library")}{" "}
              <small>({assets.length})</small>
            </h2>
            <input
              type="search"
              aria-label={t("Tìm dự án", "Search projects")}
              placeholder={t(
                "Tên dự án, loại công cụ…",
                "Project name, tool type…",
              )}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <div className="studio-project-grid">
            {assets
              .filter((a) =>
                `${a.title} ${a.kind} ${a.locale}`
                  .toLowerCase()
                  .includes(filter.toLowerCase()),
              )
              .map((a) => {
                const Icon = icons[a.kind];
                return (
                  <article key={a.id}>
                    <Icon />
                    <small>
                      {a.kind.toUpperCase()} · {a.locale.toUpperCase()} · v
                      {a.revision}
                    </small>
                    <h3>
                      <Link href={studioURL(slug, a.kind, a.id)}>
                        {a.title}
                      </Link>
                    </h3>
                    <div className="actions">
                      <Link
                        className="text-link"
                        href={studioURL(slug, a.kind, a.id)}
                      >
                        {t("Mở dự án", "Open project")} ↗
                      </Link>
                      <button type="button" onClick={() => remove(a)}>
                        {t("Xóa", "Delete")}
                      </button>
                    </div>
                  </article>
                );
              })}
          </div>
          {!assets.length && (
            <p>
              {t(
                "Chọn một công cụ phía trên để bắt đầu dự án đầu tiên.",
                "Choose a tool above to create your first project.",
              )}
            </p>
          )}
          <section className="studio-lesson-library">
            <h2>{t("Bài giảng trong hệ thống", "Lessons in your academy")}</h2>
            <label>
              {t("Lọc theo khóa học", "Filter by course")}
              <select
                value={filter.startsWith("course:") ? filter.slice(7) : ""}
                onChange={(e) =>
                  setFilter(e.target.value ? `course:${e.target.value}` : "")
                }
              >
                <option value="">{t("Tất cả khóa học", "All courses")}</option>
                {overview.courses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            {overview.lessons
              .filter((l: any) =>
                filter.startsWith("course:")
                  ? l.course_id === filter.slice(7)
                  : true,
              )
              .slice(0, 200)
              .map((l: any) => (
                <Link
                  className="studio-lesson-row"
                  key={l.id}
                  href={studioURL(slug, "lesson", l.id)}
                >
                  <BookOpen size={17} />
                  <span>
                    {l.title}
                    <small>
                      {
                        overview.courses.find((c: any) => c.id === l.course_id)
                          ?.title
                      }
                    </small>
                  </span>
                  <span>↗</span>
                </Link>
              ))}
          </section>
        </main>
      ) : (
        <>
          <div className="studio-command-bar">
            <div>
              <input
                className="studio-title"
                aria-label={t("Tên dự án", "Project title")}
                maxLength={200}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setDirty(true);
                }}
              />
              <small>
                {saving
                  ? t("Đang lưu…", "Saving…")
                  : dirty
                    ? t(
                        "Chưa lưu · có bản nháp trình duyệt",
                        "Unsaved · browser draft kept",
                      )
                    : current?.id
                      ? t("Đã đồng bộ", "Up to date")
                      : t(
                          "Dự án mới · chưa lưu",
                          "New project · not saved",
                        )}{" "}
                · Ctrl/⌘ S
              </small>
            </div>
            <div className="actions">
              <button type="button" onClick={() => setWide(!wide)}>
                {wide
                  ? t("Hiện panel", "Show panels")
                  : t("Tập trung", "Focus")}
              </button>
              <button
                type="button"
                className="button ghost small"
                onClick={() => setPreview(!preview)}
              >
                <Eye size={16} />
                {preview
                  ? t("Tiếp tục chỉnh sửa", "Continue editing")
                  : t("Xem như học viên", "Learner preview")}
              </button>
              <button
                className="button small"
                disabled={saving || !title.trim()}
                onClick={save}
              >
                <Save size={16} />
                {t("Lưu", "Save")}
              </button>
            </div>
          </div>
          {draft && (
            <div className="studio-draft-banner">
              <span>
                {t(
                  "Có bản nháp chưa lưu của tài khoản này.",
                  "An unsaved browser draft is available for your account.",
                )}
                {draft.revision !== current?.revision &&
                  t(
                    " Bản trên hệ thống đã thay đổi; khôi phục bản nháp có thể thay thế nội dung mới.",
                    " The server version has changed; restoring may replace newer content.",
                  )}
              </span>
              <button onClick={restoreDraft}>
                {t("Khôi phục bản nháp", "Restore draft")}
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(draftKey);
                  setDraft(null);
                }}
              >
                {t("Bỏ bản nháp", "Discard draft")}
              </button>
            </div>
          )}
          {kind === "lesson" ? (
            <div className="studio-lesson-layout">
              <aside className="studio-outline">
                <h3>{t("Thiết lập bài học", "Lesson settings")}</h3>
                <label>
                  {t("Khóa học", "Course")}
                  <select
                    value={course}
                    disabled={!!current?.id}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setDirty(true);
                    }}
                  >
                    {overview.courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </label>
                {!overview.courses.length && (
                  <Link
                    href={
                      kind === "lesson" && current?.course_id
                        ? `/t/${slug}/administrator?tab=courses&course=${current.course_id}&lesson=${current.id}`
                        : `/t/${slug}/administrator`
                    }
                  >
                    {t("Tạo khóa học trước", "Create a course first")}
                  </Link>
                )}
                <label>
                  {t("Thứ tự", "Position")}
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    value={position}
                    onChange={(e) => {
                      setPosition(+e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
                <label>
                  {t("Video HTTPS (tùy chọn)", "HTTPS video (optional)")}
                  <input
                    type="url"
                    value={videoURL}
                    onChange={(e) => {
                      setVideoURL(e.target.value);
                      setDirty(true);
                    }}
                  />
                </label>
                <h3>{t("Tìm trong bài", "Find in lesson")}</h3>
                <input
                  type="search"
                  value={find}
                  aria-label={t("Tìm trong bài", "Find in lesson")}
                  onChange={(e) => setFind(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!editor || !find) return;
                    let result: any = null;
                    editor.state.doc.descendants((node: any, pos: number) => {
                      if (result || !node.isText) return;
                      const at = node.text
                        .toLowerCase()
                        .indexOf(find.toLowerCase());
                      if (at >= 0)
                        result = { from: pos + at, to: pos + at + find.length };
                    });
                    if (result)
                      editor.chain().focus().setTextSelection(result).run();
                    else
                      setNotice(
                        t("Không tìm thấy từ khóa.", "No matching text."),
                      );
                  }}
                >
                  {t("Tìm", "Find")}
                </button>
                <h3>{t("Cấu trúc bài học", "Lesson outline")}</h3>
                {(
                  docs?.vi?.document?.content ||
                  current?.document?.content ||
                  []
                )
                  .filter((n: any) => n.type === "heading")
                  .map((n: any, i: number) => (
                    <p className="outline-heading" key={i}>
                      {n.content?.map((c: any) => c.text || "").join("")}
                    </p>
                  ))}
              </aside>
              <main className="studio-writing-canvas">
                {preview ? (
                  <>
                    <h1>{title}</h1>
                    <LessonView lesson={lessonPreview} />
                  </>
                ) : (
                  <LessonEditor
                    key={`${projectId}-${editorKey}`}
                    initial={current}
                    onReady={setEditor}
                    onChange={changeDocs}
                  />
                )}
              </main>
              <aside className="studio-resource-panel">
                <h3>{t("Chèn học liệu", "Insert learning media")}</h3>
                <p>
                  {t(
                    "Chèn bản sao chỉnh sửa được của dự án. Thay đổi dự án gốc sẽ không làm đổi bài học.",
                    "Insert a project snapshot. Changes to the source project do not alter this lesson.",
                  )}
                </p>
                {studioTools().map((tool) => (
                  <Link
                    key={tool.id}
                    target="_blank"
                    href={studioURL(slug, tool.id)}
                  >
                    + {tool.label[locale]} ↗
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    api<StudioAsset[]>(`${base}/studio`)
                      .then(setAssets)
                      .catch((e) => setError(e.message))
                  }
                >
                  {t("Làm mới thư viện", "Refresh library")}
                </button>
                <input
                  type="search"
                  aria-label={t("Tìm học liệu", "Search learning media")}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {assets
                  .filter((a) =>
                    a.title.toLowerCase().includes(filter.toLowerCase()),
                  )
                  .map((a) => (
                    <button
                      type="button"
                      className="studio-asset-insert"
                      disabled={preview}
                      key={a.id}
                      onClick={() => embed(a)}
                    >
                      <small>
                        {a.kind} · {a.locale.toUpperCase()}
                      </small>
                      <strong>{a.title}</strong>
                      <span>+ {t("Chèn vào bài", "Insert into lesson")}</span>
                    </button>
                  ))}
              </aside>
            </div>
          ) : (
            project && (
              <>
                <div className="studio-export-bar">
                  <label>
                    {t("Ngôn ngữ nội dung", "Content language")}
                    <select
                      value={contentLocale}
                      onChange={(e) => {
                        setContentLocale(e.target.value as "vi" | "en");
                        setDirty(true);
                      }}
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      download(
                        new Blob(
                          [
                            JSON.stringify(
                              {
                                title,
                                kind,
                                locale: contentLocale,
                                data: project,
                              },
                              null,
                              2,
                            ),
                          ],
                          { type: "application/json" },
                        ),
                        "learning-project.json",
                      )
                    }
                  >
                    <Download size={15} /> JSON
                  </button>
                  {kind !== "simulation" && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            printSlides(project as Presentation, title);
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        {t("In / lưu PDF", "Print / save PDF")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          download(
                            new Blob(
                              [slideHTML(project as Presentation, title)],
                              { type: "text/html" },
                            ),
                            "lesson-slides.html",
                          )
                        }
                      >
                        HTML
                      </button>
                    </>
                  )}
                  {kind === "video" && (
                    <>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={microphone}
                          onChange={(e) => setMicrophone(e.target.checked)}
                        />
                        {t(
                          "Thu lời giảng từ micro",
                          "Record microphone narration",
                        )}
                      </label>
                      <button
                        type="button"
                        disabled={recording !== null}
                        onClick={async () => {
                          setError("");
                          const control = new AbortController();
                          abort.current = control;
                          setRecording(0);
                          try {
                            await exportVideo(
                              project as Presentation,
                              title,
                              control.signal,
                              setRecording,
                              microphone,
                            );
                            setNotice(
                              t("Đã xuất file video.", "Video file exported."),
                            );
                          } catch (e) {
                            if ((e as Error).name !== "AbortError")
                              setError((e as Error).message);
                          } finally {
                            setRecording(null);
                          }
                        }}
                      >
                        {t("Xuất video", "Export video")}
                      </button>
                    </>
                  )}
                  {recording !== null && (
                    <>
                      <output>{recording}%</output>
                      <button
                        type="button"
                        onClick={() => abort.current?.abort()}
                      >
                        <X size={15} />
                        {t("Hủy xuất", "Cancel export")}
                      </button>
                    </>
                  )}
                </div>
                {kind === "video" && (
                  <p className="studio-hint">
                    {t(
                      "Xuất video chạy theo thời lượng thật; bật micro để thu giọng của bạn. Lời đọc tự động chỉ dùng khi xem trước. Video tải về máy, dự án và kịch bản được lưu trong hệ thống.",
                      "Export runs in real time; enable the microphone to record your voice. Automatic narration is preview-only. Video files download to your device; projects and scripts are saved in the system.",
                    )}
                  </p>
                )}
                <ProjectEditor
                  kind={kind as ProjectKind}
                  data={project}
                  preview={preview}
                  onChange={(value) => {
                    setProject(value);
                    setDirty(true);
                  }}
                />
              </>
            )
          )}
        </>
      )}
    </div>
  );
}
