"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  ArrowUpRight,
  Save,
  X,
  Check,
  FileText,
} from "lucide-react";
import { api, slugify } from "@/lib/api";
import { studioURL } from "@/lib/studio/types";
import LessonEditor from "./lesson/lesson-editor";
import { useI18n } from "./locale-provider";
import { ErrorBox } from "./shared";

export default function CourseWorkspace({
  data,
  onRefresh,
  onDirty,
}: {
  data: any;
  onRefresh: () => Promise<any>;
  onDirty: (value: boolean) => void;
}) {
  const { t, locale } = useI18n(),
    query = useSearchParams(),
    router = useRouter(),
    base = `/runtime/${data.tenant.id}`;
  const [courseId, setCourseId] = useState(
      query.get("course") || data.courses[0]?.id || "",
    ),
    [lessonId, setLessonId] = useState(query.get("lesson") || ""),
    [lesson, setLesson] = useState<any>(null),
    [creating, setCreating] = useState(false),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [dirty, setDirty] = useState(false),
    [courseSearch, setCourseSearch] = useState(""),
    [lessonSearch, setLessonSearch] = useState(""),
    [courseEdit, setCourseEdit] = useState<any>(null);
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  const fingerprint = useRef<string | null>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const course = data.courses.find((c: any) => c.id === courseId),
    lessons = data.lessons
      .filter((l: any) => l.course_id === courseId)
      .sort(
        (a: any, b: any) => a.position - b.position || a.id.localeCompare(b.id),
      );
  const text = (row: any) =>
    row.translations?.[locale]?.title ||
    row.localized_titles?.[locale] ||
    row.title;
  function canLeave() {
    return (
      !dirty ||
      confirm(
        t(
          "Bài học chưa lưu. Bỏ các thay đổi này?",
          "This lesson has unsaved changes. Discard them?",
        ),
      )
    );
  }
  function address(cid: string, lid = "") {
    const params = new URLSearchParams({ tab: "courses" });
    if (cid) params.set("course", cid);
    if (lid) params.set("lesson", lid);
    window.history.replaceState(
      null,
      "",
      `/t/${data.tenant.slug}/administrator?${params}`,
    );
  }
  function selectCourse(id: string) {
    if (busy || !canLeave()) return;
    setDirty(false);
    setCourseId(id);
    setLessonId("");
    setLesson(null);
    setCreating(false);
    setError("");
    setNotice("");
    address(id);
  }
  function selectLesson(id: string) {
    if (busy || !canLeave()) return;
    setDirty(false);
    setCreating(false);
    setLessonId(id);
    setNotice("");
    address(courseId, id);
  }
  function newLesson() {
    if (busy || !canLeave()) return;
    setDirty(false);
    fingerprint.current = null;
    setLessonId("");
    setLesson(null);
    setCreating(true);
    setError("");
    setNotice("");
    address(courseId);
  }
  useEffect(() => {
    if (!lessonId) {
      setLesson(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    fingerprint.current = null;
    api(`${base}/lessons/${lessonId}`)
      .then((row) => {
        if (!cancelled) {
          setLesson(row);
          setCourseId(row.course_id);
          setDirty(false);
        }
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
  }, [base, lessonId]);
  useEffect(() => {
    if (courseEdit && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [courseEdit]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function saveLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const advanced =
        (event.nativeEvent as SubmitEvent).submitter?.getAttribute("name") ===
        "advanced",
      form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const row = await api(
        lesson
          ? `${base}/lessons/${lesson.id}`
          : `${base}/courses/${courseId}/lessons`,
        {
          method: lesson ? "PUT" : "POST",
          body: JSON.stringify({
            title: form.get("title"),
            content: form.get("content"),
            document: JSON.parse(String(form.get("document") || "null")),
            translations: JSON.parse(String(form.get("translations") || "{}")),
            video_url: form.get("video_url"),
            position: Number(form.get("position")),
            revision: lesson?.revision,
          }),
        },
      );
      setDirty(false);
      fingerprint.current = null;
      setLesson(row);
      setCreating(false);
      setLessonId(row.id);
      address(courseId, row.id);
      await onRefresh();
      setNotice(t("Đã lưu bài học.", "Lesson saved."));
      if (advanced)
        router.push(
          studioURL(
            data.tenant.slug,
            "lesson",
            row.id,
            location.pathname + location.search,
          ),
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const row = await api(
        base + "/courses" + (courseEdit?.id ? `/${courseEdit.id}` : ""),
        {
          method: courseEdit?.id ? "PUT" : "POST",
          body: JSON.stringify({
            title: f.get("title"),
            slug: f.get("slug"),
            description: f.get("description"),
            published: f.get("published") === "on",
            translations: {
              ...(courseEdit?.translations || {}),
              en: {
                title: f.get("title_en"),
                description: f.get("description_en"),
              },
            },
          }),
        },
      );
      await onRefresh();
      setCourseEdit(null);
      if (row.id !== courseId) {
        setLessonId("");
        setLesson(null);
        setCreating(false);
        setDirty(false);
      }
      setCourseId(row.id);
      setNotice(t("Đã lưu khóa học.", "Course saved."));
      address(row.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function removeLesson(row: any) {
    if (
      !canLeave() ||
      !confirm(
        t(
          "Xóa bài học này và tiến độ liên quan?",
          "Delete this lesson and its related progress?",
        ),
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api(`${base}/lessons/${row.id}`, { method: "DELETE" });
      if (lessonId === row.id) {
        setLessonId("");
        setLesson(null);
        setDirty(false);
      }
      await onRefresh();
      setNotice(t("Đã xóa bài học.", "Lesson deleted."));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="course-workspace"
      aria-label={t(
        "Không gian khóa học và bài học",
        "Course and lesson workspace",
      )}
    >
      <div className="course-workspace-top">
        <div>
          <BookOpen size={20} />
          <b>{t("Quản lý nội dung đào tạo", "Learning content")}</b>
          <span>
            {data.courses.length} {t("khóa học", "courses")} ·{" "}
            {data.lessons.length} {t("bài học", "lessons")}
          </span>
        </div>
        <button className="button small" onClick={() => setCourseEdit({})}>
          <Plus size={16} />
          {t("Tạo khóa học", "Create course")}
        </button>
      </div>
      <ErrorBox message={error} />
      {notice && (
        <div className="notice" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      <div className="course-workspace-grid">
        <aside className="course-browser">
          <div className="cw-panel-heading">
            <small>{t("01 / KHÓA HỌC", "01 / COURSES")}</small>
          </div>
          <label className="cw-search">
            <Search size={15} />
            <input
              type="search"
              aria-label={t("Tìm khóa học", "Search courses")}
              placeholder={t("Tìm khóa học…", "Search courses…")}
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
            />
          </label>
          <div className="cw-scroll">
            {data.courses
              .filter((c: any) =>
                text(c).toLowerCase().includes(courseSearch.toLowerCase()),
              )
              .map((c: any) => (
                <button
                  className={`cw-course ${courseId === c.id ? "active" : ""}`}
                  key={c.id}
                  onClick={() => selectCourse(c.id)}
                >
                  <span className="cw-course-icon">
                    <BookOpen size={17} />
                  </span>
                  <span>
                    <strong>{text(c)}</strong>
                    <small>
                      {
                        data.lessons.filter((l: any) => l.course_id === c.id)
                          .length
                      }{" "}
                      {t("bài học", "lessons")} ·{" "}
                      {c.published
                        ? t("Đã xuất bản", "Published")
                        : t("Bản nháp", "Draft")}
                    </small>
                  </span>
                </button>
              ))}
            {!data.courses.length && (
              <p className="cw-empty-note">
                {t(
                  "Tạo khóa học đầu tiên để bắt đầu.",
                  "Create your first course to begin.",
                )}
              </p>
            )}
          </div>
        </aside>
        <aside className="lesson-browser">
          <div className="cw-panel-heading">
            <small>{t("02 / BÀI HỌC", "02 / LESSONS")}</small>
            {course && (
              <button
                aria-label={t("Chỉnh sửa khóa học", "Edit course")}
                title={t("Chỉnh sửa khóa học", "Edit course")}
                onClick={() => setCourseEdit(course)}
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
          <div className="cw-course-summary">
            <h2>
              {course ? text(course) : t("Chọn khóa học", "Choose a course")}
            </h2>
            <button
              className="button small full"
              disabled={!course || busy}
              onClick={newLesson}
            >
              <Plus size={16} />
              {t("Thêm bài học", "Add lesson")}
            </button>
          </div>
          <label className="cw-search">
            <Search size={15} />
            <input
              type="search"
              aria-label={t("Tìm bài học", "Search lessons")}
              placeholder={t("Tìm bài học…", "Search lessons…")}
              value={lessonSearch}
              onChange={(e) => setLessonSearch(e.target.value)}
            />
          </label>
          <div className="cw-scroll">
            {lessons
              .filter((row: any) =>
                text(row).toLowerCase().includes(lessonSearch.toLowerCase()),
              )
              .map((row: any, i: number) => (
                <div
                  key={row.id}
                  className={`cw-lesson ${lessonId === row.id ? "active" : ""}`}
                >
                  <button
                    className="cw-lesson-select"
                    onClick={() => selectLesson(row.id)}
                  >
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <strong>{text(row)}</strong>
                    <Pencil size={13} />
                  </button>
                  <button
                    className="cw-delete"
                    aria-label={`${t("Xóa bài học", "Delete lesson")} ${text(row)}`}
                    disabled={busy}
                    onClick={() => removeLesson(row)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            {course && !lessons.length && (
              <p className="cw-empty-note">
                {t(
                  "Chưa có bài học. Nhấn Thêm bài học để biên soạn.",
                  "No lessons yet. Add a lesson to start writing.",
                )}
              </p>
            )}
          </div>
        </aside>
        <main className="lesson-workbench">
          {loading ? (
            <div className="cw-empty">
              <FileText size={32} />
              <p>{t("Đang mở bài học…", "Opening lesson…")}</p>
            </div>
          ) : lesson || creating ? (
            <form
              key={`${lesson?.id || "new"}:${lesson?.revision || 0}:${courseId}`}
              onSubmit={saveLesson}
              onChange={() => setDirty(true)}
              inert={busy}
            >
              <header className="lesson-workbench-header">
                <div>
                  <small>{t("03 / BIÊN TẬP", "03 / EDITOR")}</small>
                  <h2>
                    {lesson
                      ? t("Chỉnh sửa bài học", "Edit lesson")
                      : t("Thêm bài học", "Add lesson")}
                  </h2>
                  <span className={dirty ? "cw-dirty" : ""}>
                    {dirty
                      ? t("Có thay đổi chưa lưu", "Unsaved changes")
                      : lesson
                        ? t("Đã lưu", "Saved")
                        : t("Bản nháp mới", "New draft")}
                  </span>
                </div>
                <div className="actions">
                  <button type="submit" className="button small">
                    <Save size={15} />
                    {t("Lưu bài học", "Save lesson")}
                  </button>
                  <button
                    type="submit"
                    name="advanced"
                    className="button ghost small"
                  >
                    <ArrowUpRight size={15} />
                    {t("Mở Studio toàn màn hình", "Open full-page Studio")}
                  </button>
                </div>
              </header>
              <div className="lesson-workbench-body">
                <label>
                  {t("Tiêu đề", "Title")}
                  <input
                    name="title"
                    required
                    maxLength={200}
                    autoFocus={!lesson}
                    placeholder={t("Đặt tên bài học…", "Name this lesson…")}
                    defaultValue={lesson?.title}
                  />
                </label>
                <LessonEditor
                  initial={lesson}
                  onChange={(value) => {
                    const next = JSON.stringify(value);
                    if (
                      fingerprint.current !== null &&
                      fingerprint.current !== next
                    )
                      setDirty(true);
                    fingerprint.current = next;
                  }}
                />
                <details className="cw-lesson-settings">
                  <summary>
                    {t("Video và thứ tự bài học", "Video and lesson order")}
                  </summary>
                  <div>
                    <label>
                      {t("Video HTTPS (tùy chọn)", "HTTPS video (optional)")}
                      <input
                        type="url"
                        name="video_url"
                        defaultValue={lesson?.video_url || ""}
                      />
                    </label>
                    <label>
                      {t("Thứ tự (bắt đầu từ 0)", "Position (starts at 0)")}
                      <input
                        name="position"
                        type="number"
                        min={0}
                        max={10000}
                        defaultValue={
                          lesson?.position ??
                          (lessons.length
                            ? Math.max(
                                ...lessons.map((row: any) => row.position),
                              ) + 1
                            : 0)
                        }
                      />
                    </label>
                  </div>
                </details>
              </div>
            </form>
          ) : (
            <div className="cw-empty">
              <span>
                <FileText size={36} />
              </span>
              <h2>
                {t(
                  "Tập trung vào từng bài học.",
                  "Focus on one lesson at a time.",
                )}
              </h2>
              <p>
                {t(
                  "Chọn bài ở cột bên cạnh để chỉnh sửa ngay, hoặc tạo bài mới. Danh sách luôn ở trong tầm tay.",
                  "Select a lesson alongside to edit it, or create a new one. Your lesson list stays within reach.",
                )}
              </p>
              <button className="button" disabled={!course} onClick={newLesson}>
                <Plus size={16} />
                {t("Thêm bài học", "Add lesson")}
              </button>
            </div>
          )}
        </main>
      </div>
      {courseEdit && (
        <dialog
          ref={dialog}
          className="course-edit-dialog"
          onCancel={(e) => {
            if (busy) e.preventDefault();
            else setCourseEdit(null);
          }}
        >
          <form onSubmit={saveCourse}>
            <header>
              <div>
                <small>{t("THIẾT LẬP KHÓA HỌC", "COURSE SETTINGS")}</small>
                <h2>
                  {courseEdit.id
                    ? t("Chỉnh sửa khóa học", "Edit course")
                    : t("Tạo khóa học", "Create course")}
                </h2>
              </div>
              <button
                type="button"
                aria-label={t(
                  "Đóng thiết lập khóa học",
                  "Close course settings",
                )}
                disabled={busy}
                onClick={() => setCourseEdit(null)}
              >
                <X size={20} />
              </button>
            </header>
            <ErrorBox message={error} />
            <div className="course-edit-dialog-body">
              <label>
                {t("Tên khóa học", "Course name")}
                <input
                  name="title"
                  required
                  maxLength={200}
                  defaultValue={courseEdit.title || ""}
                  onChange={(e) => {
                    if (!courseEdit.id)
                      (
                        e.target.form!.elements.namedItem(
                          "slug",
                        ) as HTMLInputElement
                      ).value = slugify(e.target.value);
                  }}
                />
              </label>
              <label>
                {t("Đường dẫn", "Slug")}
                <input
                  name="slug"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  defaultValue={courseEdit.slug || ""}
                />
              </label>
              <label>
                {t("Mô tả", "Description")}
                <textarea
                  name="description"
                  aria-label={t("Mô tả", "Description")}
                  rows={4}
                  defaultValue={courseEdit.description || ""}
                />
              </label>
              <details>
                <summary>
                  {t("Bản dịch tiếng Anh", "English translation")}
                </summary>
                <label>
                  {t("Tên khóa học tiếng Anh", "English course title")}
                  <input
                    name="title_en"
                    maxLength={200}
                    defaultValue={courseEdit.translations?.en?.title || ""}
                  />
                </label>
                <label>
                  {t("Mô tả tiếng Anh", "English description")}
                  <textarea
                    name="description_en"
                    defaultValue={
                      courseEdit.translations?.en?.description || ""
                    }
                  />
                </label>
              </details>
              <label className="checkbox">
                <input
                  type="checkbox"
                  name="published"
                  defaultChecked={courseEdit.published}
                />
                {t("Xuất bản cho học viên", "Publish for learners")}
              </label>
            </div>
            <footer>
              <button
                type="button"
                className="button ghost"
                disabled={busy}
                onClick={() => setCourseEdit(null)}
              >
                {t("Hủy", "Cancel")}
              </button>
              <button className="button" disabled={busy}>
                {busy
                  ? t("Đang lưu…", "Saving…")
                  : t("Lưu khóa học", "Save course")}
              </button>
            </footer>
          </form>
        </dialog>
      )}
    </section>
  );
}
