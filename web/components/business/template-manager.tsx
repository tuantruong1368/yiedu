"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Plus,
  ArrowLeft,
  Search,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Save,
  BookOpen,
  X,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { api, slugify } from "@/lib/api";
import { ErrorBox, Loading } from "../shared";
import { useI18n } from "../locale-provider";
import TemplateThumbnail from "../template-thumbnail";
const LessonEditor = dynamic(() => import("../lesson/lesson-editor"), {
  ssr: false,
});
export default function TemplateManager({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const { t } = useI18n(),
    query = useSearchParams(),
    router = useRouter(),
    id = query.get("template") || "",
    [list, setList] = useState<any[]>([]),
    [groups, setGroups] = useState<any[]>([]),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [search, setSearch] = useState(""),
    [lesson, setLesson] = useState<[number, number] | null>(null);
  const load = () => api("/platform/templates").then(setList);
  useEffect(() => {
    load().catch((e) => setError(e.message));
    api("/catalog/template-groups").then(setGroups);
  }, []);
  useEffect(() => {
    if (id) {
      setData(null);
      api(`/platform/templates/${id}`)
        .then((d) => {
          setData(d);
          setDirty(false);
        })
        .catch((e) => setError(e.message));
    } else {
      setData(null);
      setDirty(false);
    }
  }, [id]);
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function change(p: any) {
    setData((d: any) => ({ ...d, ...p }));
    setDirty(true);
  }
  function open(value: string) {
    if (
      dirty &&
      !confirm(
        t("Thay đổi chưa lưu. Rời trang?", "Leave with unsaved changes?"),
      )
    )
      return;
    setError("");
    setNotice("");
    history.pushState(
      null,
      "",
      `/platform?tab=templates${value ? `&template=${encodeURIComponent(value)}` : ""}`,
    );
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      const { id: key, ...payload } = data;
      const saved = await api(`/platform/templates/${key}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setData(saved);
      setDirty(false);
      setNotice(t("Đã lưu template.", "Template saved."));
      await load();
      if (!id)
        history.replaceState(
          null,
          "",
          `/platform?tab=templates&template=${key}`,
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function create(base = "academy") {
    if (
      dirty &&
      !confirm(t("Bỏ thay đổi chưa lưu?", "Discard unsaved changes?"))
    )
      return;
    setError("");
    setBusy(true);
    try {
      const d = await api(`/platform/templates/${base}`);
      const key = `template-${Date.now().toString(36)}`;
      const { id: _, ...payload } = d;
      await api(`/platform/templates/${key}`, {
        method: "PUT",
        body: JSON.stringify({
          ...payload,
          name: d.name + " · " + t("bản sao", "copy"),
          status: "draft",
          revision: 1,
        }),
      });
      setDirty(false);
      history.pushState(null, "", `/platform?tab=templates&template=${key}`);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function updateCourse(index: number, patch: any) {
    const courses = data.courses.map((c: any, i: number) =>
      i === index ? { ...c, ...patch } : c,
    );
    change({ courses });
  }
  function updateLesson(ci: number, li: number, patch: any) {
    setData((d: any) => ({
      ...d,
      courses: d.courses.map((c: any, i: number) =>
        i === ci
          ? {
              ...c,
              lessons: c.lessons.map((l: any, j: number) =>
                j === li ? { ...l, ...patch } : l,
              ),
            }
          : c,
      ),
    }));
    setDirty(true);
  }
  async function design() {
    if (dirty) {
      setError(
        t(
          "Lưu thay đổi trước khi mở Website Studio.",
          "Save changes before opening Website Studio.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const d = await api(`/platform/templates/${data.id}/design`, {
        method: "POST",
      });
      router.push(
        `/builder/${d.workspace_id}?managedTemplate=${data.id}&templateRevision=${d.template_revision}&returnTo=${encodeURIComponent(`/platform?tab=templates&template=${data.id}`)}`,
      );
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="business-stack">
      <ErrorBox message={error} />
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {data ? (
        <>
          <div className="editor-heading">
            <button className="text-link" onClick={() => open("")}>
              <ArrowLeft size={16} />
              {t("Thư viện template", "Template library")}
            </button>
            <div className="actions">
              <button
                className="button small ghost"
                onClick={design}
                disabled={busy || dirty}
              >
                <Pencil size={15} />
                {t("Mở Website Studio", "Open Website Studio")}
              </button>
              <button className="button small" onClick={save} disabled={busy}>
                <Save size={15} />
                {t("Lưu template", "Save template")}
              </button>
            </div>
          </div>
          <div className="template-editor-grid">
            <section className="panel">
              <span className="eyebrow">
                {dirty
                  ? t("CÓ THAY ĐỔI CHƯA LƯU", "UNSAVED CHANGES")
                  : "TEMPLATE SETTINGS"}
              </span>
              <h2>{data.name}</h2>
              <label>
                {t("Mã template", "Template identifier")}
                <input
                  value={data.id}
                  disabled={!!id}
                  maxLength={100}
                  onChange={(e) => change({ id: slugify(e.target.value) })}
                />
              </label>
              <label>
                {t("Tên template", "Template name")}
                <input
                  value={data.name}
                  maxLength={200}
                  onChange={(e) => change({ name: e.target.value })}
                />
              </label>
              <label>
                {t("Nhóm", "Category")}
                <select
                  value={data.category_id}
                  onChange={(e) => change({ category_id: e.target.value })}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label.vi} / {g.label.en}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Mô tả tiếng Việt", "Vietnamese description")}
                <textarea
                  value={data.description}
                  maxLength={2000}
                  rows={4}
                  onChange={(e) => change({ description: e.target.value })}
                />
              </label>
              <label>
                {t("Mô tả tiếng Anh", "English description")}
                <textarea
                  value={data.description_en}
                  maxLength={2000}
                  rows={4}
                  onChange={(e) => change({ description_en: e.target.value })}
                />
              </label>
              <div className="form-pair">
                <label>
                  {t("Màu đại diện", "Accent color")}
                  <input
                    type="color"
                    value={data.color}
                    onChange={(e) => change({ color: e.target.value })}
                  />
                </label>
                <label>
                  {t("Trạng thái", "Status")}
                  <select
                    value={data.status}
                    onChange={(e) => change({ status: e.target.value })}
                  >
                    <option value="draft">{t("Bản nháp", "Draft")}</option>
                    <option value="published">
                      {t("Xuất bản", "Published")}
                    </option>
                    <option value="archived">
                      {t("Thùng rác", "Archived")}
                    </option>
                  </select>
                </label>
              </div>
              <small>
                {t(
                  "Website và khóa học khách đã tạo là bản sao riêng, được giữ nguyên khi template thay đổi.",
                  "Previously created websites and courses are independent copies and are preserved when this template changes.",
                )}
              </small>
              <div className="actions">
                <button
                  className="button ghost small"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      }),
                      url = URL.createObjectURL(blob),
                      a = document.createElement("a");
                    a.href = url;
                    a.download = data.id + ".json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download size={14} />
                  {t("Xuất JSON", "Export JSON")}
                </button>
                <label className="button ghost small import-template">
                  <Upload size={14} />
                  {t("Nhập JSON", "Import JSON")}
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 2000000) {
                        setError(
                          t("File tối đa 2 MB.", "Maximum file size: 2 MB."),
                        );
                        return;
                      }
                      try {
                        const { id: ignored, ...raw } = JSON.parse(
                          await f.text(),
                        );
                        const d = await api("/platform/templates/validate", {
                          method: "POST",
                          body: JSON.stringify(raw),
                        });
                        change({ ...d, id: data.id, revision: data.revision });
                      } catch {
                        setError(
                          t("File JSON không hợp lệ.", "Invalid JSON file."),
                        );
                      }
                    }}
                  />
                </label>
              </div>
            </section>
            <section className="panel">
              <div className="section-title">
                <div>
                  <span className="eyebrow">CURRICULUM LIBRARY</span>
                  <h2>
                    {t("Khóa học đi cùng template", "Template curriculum")}
                  </h2>
                </div>
                <button
                  className="button small ghost"
                  onClick={() =>
                    change({
                      courses: [
                        ...data.courses,
                        {
                          title: t("Khóa học mới", "New course"),
                          description: "",
                          lessons: [],
                        },
                      ],
                    })
                  }
                >
                  <Plus size={15} />
                  {t("Thêm khóa", "Add course")}
                </button>
              </div>
              {data.courses.map((c: any, ci: number) => (
                <details className="template-course-edit" key={ci}>
                  <summary>
                    <BookOpen size={17} />
                    {c.title}
                    <small>
                      {c.lessons.length} {t("bài", "lessons")}
                    </small>
                  </summary>
                  <label>
                    {t("Tên khóa học", "Course title")}
                    <input
                      value={c.title}
                      maxLength={200}
                      onChange={(e) =>
                        updateCourse(ci, { title: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    {t("Mô tả", "Description")}
                    <textarea
                      value={c.description}
                      maxLength={10000}
                      onChange={(e) =>
                        updateCourse(ci, { description: e.target.value })
                      }
                    />
                  </label>
                  {c.lessons.map((l: any, li: number) => (
                    <div className="template-lesson-row" key={li}>
                      <span>
                        {li + 1}. {l.title}
                      </span>
                      <button
                        className="text-link"
                        onClick={() => setLesson([ci, li])}
                      >
                        <Pencil size={14} />
                        {t("Biên tập", "Edit")}
                      </button>
                      <button
                        className="icon-button danger-text"
                        aria-label={t("Xóa bài", "Delete lesson")}
                        onClick={() => {
                          if (
                            confirm(
                              t(
                                "Xóa bài khỏi template?",
                                "Remove this lesson from the template?",
                              ),
                            )
                          )
                            updateCourse(ci, {
                              lessons: c.lessons.filter(
                                (_: any, i: number) => i !== li,
                              ),
                            });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="actions">
                    <button
                      className="text-link"
                      onClick={() => {
                        updateCourse(ci, {
                          lessons: [
                            ...c.lessons,
                            {
                              title: t("Bài học mới", "New lesson"),
                              content: "",
                              document: null,
                              video_url: "",
                              position: c.lessons.length,
                              translations: {},
                            },
                          ],
                        });
                        setLesson([ci, c.lessons.length]);
                      }}
                    >
                      <Plus size={14} />
                      {t("Thêm bài học", "Add lesson")}
                    </button>
                    <button
                      className="text-link danger-text"
                      onClick={() => {
                        if (
                          confirm(
                            t(
                              "Xóa khóa học khỏi template?",
                              "Remove this course from the template?",
                            ),
                          )
                        )
                          change({
                            courses: data.courses.filter(
                              (_: any, i: number) => i !== ci,
                            ),
                          });
                      }}
                    >
                      <Trash2 size={14} />
                      {t("Xóa khóa", "Delete course")}
                    </button>
                  </div>
                </details>
              ))}
              {!data.courses.length && (
                <div className="empty">
                  <BookOpen />
                  <p>
                    {t(
                      "Thêm khóa học hoặc dùng AI Studio để tạo nội dung.",
                      "Add a course or create curriculum with AI Studio.",
                    )}
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      ) : id ? (
        <Loading />
      ) : (
        <>
          <div className="section-title">
            <div>
              <span className="eyebrow">TEMPLATE COLLECTION</span>
              <h2>
                {t(
                  "Thiết kế cho những khởi đầu mới.",
                  "Design for new beginnings.",
                )}
              </h2>
            </div>
            <button className="button" onClick={() => create()} disabled={busy}>
              <Plus size={16} />
              {t("Tạo template", "Create template")}
            </button>
          </div>
          <div className="template-search-row">
            <label className="search-field">
              <Search size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Tìm tên hoặc mã template", "Search templates")}
              />
            </label>
          </div>
          <div className="managed-template-grid">
            {list
              .filter((x) =>
                (x.name + " " + x.id)
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
              .map((x) => (
                <article className="managed-template-card" key={x.id}>
                  {x.status === "published" ? (
                    <TemplateThumbnail
                      id={x.id}
                      name={x.name}
                      version={x.version || x.revision}
                    />
                  ) : (
                    <div
                      className="template-draft-art"
                      style={
                        { "--template-color": x.color } as React.CSSProperties
                      }
                    >
                      <Pencil size={36} />
                      <span>
                        {x.status === "archived"
                          ? t("TRONG THÙNG RÁC", "ARCHIVED")
                          : t("BẢN THIẾT KẾ NHÁP", "DESIGN DRAFT")}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="section-title">
                      <small>{x.category}</small>
                      <span className="pill">
                        {x.status === "published"
                          ? t("Đã xuất bản", "Published")
                          : x.status === "draft"
                            ? t("Bản nháp", "Draft")
                            : t("Thùng rác", "Archived")}
                      </span>
                    </div>
                    <h3>{x.name}</h3>
                    <small>
                      {x.course_count} {t("khóa", "courses")} · {x.lesson_count}{" "}
                      {t("bài học", "lessons")}
                    </small>
                    <div className="actions">
                      <button
                        className="button ghost small"
                        onClick={() => open(x.id)}
                      >
                        <Pencil size={14} />
                        {t("Chỉnh sửa", "Edit")}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={t("Nhân bản", "Duplicate")}
                        onClick={() => create(x.id)}
                      >
                        <Copy size={16} />
                      </button>
                      {x.status === "published" && (
                        <Link
                          href={`/templates/${x.id}?returnTo=${encodeURIComponent("/platform?tab=templates")}`}
                          className="icon-button"
                          aria-label={t("Xem trước", "Preview")}
                        >
                          <ExternalLink size={16} />
                        </Link>
                      )}
                      {x.status !== "archived" && (
                        <button
                          className="icon-button danger-text"
                          aria-label={t("Xóa template", "Archive template")}
                          onClick={async () => {
                            if (
                              !confirm(
                                t(
                                  "Chuyển template vào thùng rác? Website đã tạo được giữ nguyên.",
                                  "Archive this template? Existing websites are preserved.",
                                ),
                              )
                            )
                              return;
                            try {
                              await api(
                                `/platform/templates/${x.id}?revision=${x.revision}`,
                                { method: "DELETE" },
                              );
                              await load();
                            } catch (e) {
                              setError((e as Error).message);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </>
      )}
      {lesson && data && (
        <div className="business-modal-backdrop">
          <section
            className="business-modal template-lesson-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-lesson-heading"
          >
            <div className="section-title">
              <h2 id="template-lesson-heading">
                {t("Biên tập bài giảng template", "Edit template lesson")}
              </h2>
              <button className="button small" onClick={() => setLesson(null)}>
                <CheckIcon />
                {t("Xong", "Done")}
              </button>
            </div>
            <label>
              {t("Tên bài học", "Lesson title")}
              <input
                value={data.courses[lesson[0]].lessons[lesson[1]].title}
                maxLength={200}
                onChange={(e) =>
                  updateLesson(lesson[0], lesson[1], { title: e.target.value })
                }
              />
            </label>
            <label>
              {t("Video HTTPS", "HTTPS video URL")}
              <input
                type="url"
                value={
                  data.courses[lesson[0]].lessons[lesson[1]].video_url || ""
                }
                onChange={(e) =>
                  updateLesson(lesson[0], lesson[1], {
                    video_url: e.target.value,
                  })
                }
              />
            </label>
            <LessonEditor
              key={lesson.join(":")}
              initial={data.courses[lesson[0]].lessons[lesson[1]]}
              onChange={(docs) =>
                updateLesson(lesson[0], lesson[1], {
                  ...docs.vi,
                  translations: { en: docs.en },
                })
              }
            />
          </section>
        </div>
      )}
    </div>
  );
}
function CheckIcon() {
  return <Save size={15} />;
}
