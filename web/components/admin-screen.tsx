"use client";
import { useI18n } from "./locale-provider";
import { studioURL } from "@/lib/studio/types";
import { Library } from "lucide-react";
import LessonEditor from "./lesson/lesson-editor";
import { TenantBrand } from "./tenant-brand";
import { LocaleSwitch } from "./locale-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  Layers3,
  Users,
  Puzzle,
  Download,
  RefreshCw,
  ArrowUpRight,
  Plus,
  Globe2,
  GraduationCap,
  Route,
  Check,
  ChevronRight,
} from "lucide-react";
import { api, slugify } from "@/lib/api";
import { Brand, ErrorBox, Loading, Logout, Empty } from "./shared";
const tabs = [
  ["overview", "Tổng quan", LayoutDashboard],
  ["courses", "Khóa học", BookOpen],
  ["studio", "Studio nội dung", Library],
  ["paths", "Lộ trình", Route],
  ["members", "Thành viên", Users],
  ["extensions", "Tiện ích", Puzzle],
  ["export", "Xuất hệ thống", Download],
  ["updates", "Cập nhật", RefreshCw],
] as const;
export default function AdminScreen({ slug }: { slug: string }) {
  const { t: tr, locale } = useI18n();

  const [data, setData] = useState<any>(null),
    [tab, setTab] = useState("overview"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [catalog, setCatalog] = useState<any[]>([]),
    [editing, setEditing] = useState<any>(null),
    [course, setCourse] = useState(""),
    [lessonEdit, setLessonEdit] = useState<any>(null),
    [pathCourses, setPathCourses] = useState<string[]>([]),
    [pathEdit, setPathEdit] = useState<any>(null);
  const [tenant, setTenant] = useState<any>({ slug, name: slug, branding: {} });
  async function refresh() {
    const site = await api("/sites/" + slug);
    setTenant(site.tenant);
    const d = await api("/runtime/" + site.tenant.id + "/overview");
    setData(d);
    return d;
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    api<any[]>("/catalog/extensions").then(setCatalog);
  }, [slug]);
  const base = data ? "/runtime/" + data.tenant.id : "";
  async function action(fn: () => Promise<any>, message: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      await refresh();
      setNotice(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function fdata(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    return new FormData(e.currentTarget);
  }
  async function saveCourse(e: React.FormEvent<HTMLFormElement>) {
    const f = fdata(e);
    const success = await action(
      () =>
        api(base + "/courses" + (editing ? "/" + editing.id : ""), {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            title: f.get("title"),
            slug: f.get("slug"),
            description: f.get("description"),
            published: f.get("published") === "on",
            translations: {
              ...(editing?.translations || {}),
              en: {
                title: f.get("title_en"),
                description: f.get("description_en"),
              },
            },
          }),
        }),
      tr("Đã lưu khóa học."),
    );
    if (!success) return;
    setEditing(null);
    (document.getElementById("course-form") as HTMLFormElement)?.reset();
  }
  async function saveLesson(e: React.FormEvent<HTMLFormElement>) {
    const advanced =
      (e.nativeEvent as SubmitEvent).submitter?.getAttribute("name") ===
      "advanced";
    const f = fdata(e);
    let saved: any;
    const success = await action(
      async () =>
        (saved = await api(
          base +
            (lessonEdit
              ? "/lessons/" + lessonEdit.id
              : "/courses/" + course + "/lessons"),
          {
            method: lessonEdit ? "PUT" : "POST",
            body: JSON.stringify({
              title: f.get("title"),
              revision: lessonEdit?.revision,
              content: f.get("content"),
              document: JSON.parse(String(f.get("document") || "null")),
              translations: JSON.parse(String(f.get("translations") || "{}")),
              video_url: f.get("video_url"),
              position: Number(f.get("position")),
            }),
          },
        )),
      tr("Đã lưu bài học."),
    );
    if (success && advanced) {
      location.assign(studioURL(slug, "lesson", saved.id));
      return;
    }
    if (success) setLessonEdit(null);
  }
  if (!data)
    return (
      <>
        <header className="topbar">
          <TenantBrand tenant={data?.tenant || tenant} />
          <Link href="/dashboard">{tr("Về dashboard")}</Link>
        </header>
        <ErrorBox message={error} />
        {error ? (
          <div className="empty">
            <h2>{tr("Chưa thể mở trang quản trị")}</h2>
            <p>{tr("Đăng nhập bằng tài khoản có quyền của tenant.")}</p>
            <Link className="button" href="/login">
              {tr("Đăng nhập")}
            </Link>
          </div>
        ) : (
          <Loading />
        )}
      </>
    );
  if (!["owner", "admin", "instructor"].includes(data.role))
    return (
      <div className="empty">
        <h2>{tr("Bạn đang là học viên.")}</h2>
        <Link className="button" href={"/t/" + slug + "/learn"}>
          {tr("Vào không gian học tập")}
        </Link>
      </div>
    );
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <TenantBrand tenant={data?.tenant || tenant} />
        <div className="tenant-label">
          <span style={{ background: data.tenant.branding.color || "#215d4c" }}>
            {data.tenant.name[0]}
          </span>
          <div>
            <b>{data.tenant.name}</b>
            <small>{data.role.toUpperCase()}</small>
          </div>
        </div>
        <span className="nav-caption">{tr("KHÔNG GIAN QUẢN TRỊ")}</span>
        <nav>
          {tabs
            .filter(
              ([id]) =>
                data.role !== "instructor" ||
                ["overview", "courses", "paths", "studio"].includes(id),
            )
            .map(([id, label, Icon]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => {
                  if (id === "studio") {
                    location.assign(studioURL(slug));
                    return;
                  }
                  setTab(id);
                  setError("");
                  setNotice("");
                }}
              >
                <Icon size={18} />
                {tr(label)}
                {tab === id && <ChevronRight size={15} />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/dashboard">
            <Layers3 size={17} />
            {tr("Không gian của tôi")}
          </Link>
          <Link href={"/t/" + slug} target="_blank">
            <Globe2 size={17} /> {tr("Xem website")} <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <span>
            {data.tenant.name} <ChevronRight size={13} />{" "}
            {tr(tabs.find((t) => t[0] === tab)?.[1] || "")}
          </span>
          <div className="actions">
            <Link href={"/t/" + slug + "/learn"} className="text-link">
              <GraduationCap size={17} />
              {tr("Khu học tập")}
            </Link>
            <LocaleSwitch />
            <Logout />
          </div>
        </header>
        <main className="admin-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{tr("QUẢN TRỊ HỆ THỐNG")}</span>
              <h1>
                {tr(tabs.find((t) => t[0] === tab)?.[1] || "")}
                <span className="brand-dot">.</span>
              </h1>
              <p>
                {tab === "overview"
                  ? tr("Một góc nhìn rõ ràng để bạn tiếp tục phát triển.")
                  : tr(
                      "Tổ chức nội dung, theo dõi và làm chủ hệ thống của bạn.",
                    )}
              </p>
            </div>
            <span className="pill">
              <span className="status-dot" />
              {tr("Đang hoạt động")}
            </span>
          </div>
          <ErrorBox message={error} />
          {notice && (
            <div className="notice" role="status">
              <Check size={17} />
              {notice}
            </div>
          )}
          {tab === "overview" && (
            <>
              <div className="stats-row">
                <div>
                  <BookOpen />
                  <b>{data.courses.length}</b>
                  <span>{tr("Khóa học")}</span>
                </div>
                <div>
                  <Route />
                  <b>{data.paths.length}</b>
                  <span>{tr("Lộ trình")}</span>
                </div>
                <div>
                  <Users />
                  <b>{data.members.length}</b>
                  <span>{tr("Thành viên")}</span>
                </div>
              </div>
              <div className="panel">
                <div className="section-title">
                  <h2>{tr("Tiếp tục xây hệ thống")}</h2>
                  <Link href={"/t/" + slug} className="text-link">
                    {tr("Xem website")} ↗
                  </Link>
                </div>
                {data.tenant.template_seed?.template_id &&
                  ["owner", "admin"].includes(data.role) && (
                    <div className="notice">
                      <div>
                        <b>
                          {tr(
                            "Học liệu có slide, video theo cảnh và mô phỏng",
                            "Learning media with slides, scene playback and simulations",
                          )}
                        </b>
                        <p>
                          {tr(
                            "Cập nhật bài mẫu chưa chỉnh sửa, giữ bài đã sửa. Thư viện mới được thêm mà không nhân đôi.",
                            "Upgrade untouched starter lessons, preserve edits, and add reusable media without duplicates.",
                          )}
                        </p>
                        <button
                          type="button"
                          className="button ghost small"
                          disabled={busy}
                          onClick={() =>
                            action(
                              async () => {
                                const result = await api(
                                  base + "/studio/starter-content/upgrade",
                                  { method: "POST" },
                                );
                                setNotice(
                                  `${result.lessons_updated} ${tr("bài đã cập nhật", "lessons updated")} · ${result.lessons_preserved} ${tr("bài được giữ", "lessons preserved")}`,
                                );
                              },
                              tr(
                                "Đã cập nhật học liệu mẫu.",
                                "Starter learning media updated.",
                              ),
                            )
                          }
                        >
                          {tr(
                            "Cập nhật học liệu mẫu",
                            "Update starter learning media",
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                <Link className="button" href={studioURL(slug)}>
                  <Library size={18} />
                  {tr("Mở Studio nội dung", "Open Content Studio")} ↗
                </Link>
                <div className="quick-actions">
                  <button onClick={() => setTab("courses")}>
                    <BookOpen />
                    <b>{tr("Tạo bài học đầu tiên")}</b>
                    <span>{tr("Chia sẻ điều bạn biết với học viên.")}</span>
                  </button>
                  <button onClick={() => setTab("paths")}>
                    <Route />
                    <b>{tr("Thiết kế một lộ trình")}</b>
                    <span>{tr("Đưa học viên đi từng bước rõ ràng.")}</span>
                  </button>
                  <button onClick={() => setTab("extensions")}>
                    <Puzzle />
                    <b>{tr("Mở rộng khả năng")}</b>
                    <span>{tr("Kích hoạt tiện ích cho hệ thống.")}</span>
                  </button>
                </div>
              </div>
              <div className="panel">
                <h2>{tr("Hoạt động gần đây")}</h2>
                {!data.events.length ? (
                  <p>{tr("Chưa có hoạt động được ghi nhận.")}</p>
                ) : (
                  data.events.slice(0, 8).map((e: any) => (
                    <div className="activity-row" key={e.id}>
                      <span className="status-dot" />
                      <b>{e.event_type}</b>
                      <small>
                        {new Date(e.created_at).toLocaleString(
                          locale === "vi" ? "vi-VN" : "en-US",
                        )}
                      </small>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          {tab === "courses" && (
            <>
              <div className="content-columns">
                <section className="panel">
                  <div className="section-title">
                    <h2>{tr("Danh sách khóa học")}</h2>
                    <span className="pill">{data.courses.length}</span>
                  </div>
                  {!data.courses.length ? (
                    <Empty
                      title={tr("Khóa học đầu tiên đang chờ bạn")}
                      body={tr("Tạo nội dung bên phải để bắt đầu.")}
                    />
                  ) : (
                    data.courses.map((c: any) => (
                      <article className="admin-course" key={c.id}>
                        <div>
                          <span
                            className={"pill " + (c.published ? "green" : "")}
                          >
                            {c.published ? tr("Đã xuất bản") : tr("Bản nháp")}
                          </span>
                          <h3>{c.title}</h3>
                          <p>{c.description}</p>
                          <small>
                            {
                              data.lessons.filter(
                                (l: any) => l.course_id === c.id,
                              ).length
                            }{" "}
                            {tr("bài học")}
                          </small>
                        </div>
                        <div className="actions">
                          <button
                            className="button ghost small"
                            onClick={() => setEditing(c)}
                          >
                            {tr("Chỉnh sửa")}
                          </button>
                          <button
                            className="button small"
                            onClick={() => {
                              setCourse(c.id);
                              setLessonEdit(null);
                            }}
                          >
                            {tr("Bài học")}
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </section>
                <section className="panel">
                  <h2>
                    {editing ? tr("Chỉnh sửa khóa học") : tr("Tạo khóa học")}
                  </h2>
                  <form
                    id="course-form"
                    key={editing?.id || "new"}
                    onSubmit={saveCourse}
                  >
                    <label>
                      {tr("Tên khóa học")}
                      <input
                        name="title"
                        defaultValue={editing?.title}
                        required
                        onChange={(e) => {
                          if (!editing)
                            (
                              e.target.form!.elements.namedItem(
                                "slug",
                              ) as HTMLInputElement
                            ).value = slugify(e.target.value);
                        }}
                      />
                    </label>
                    <label>
                      {tr("Đường dẫn")}
                      <input
                        name="slug"
                        defaultValue={editing?.slug}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        required
                      />
                    </label>
                    <label>
                      {tr("Mô tả")}
                      <textarea
                        name="description"
                        defaultValue={editing?.description}
                        rows={4}
                      />
                    </label>
                    <label>
                      {tr("Tên khóa học tiếng Anh", "English course title")}
                      <input
                        name="title_en"
                        defaultValue={editing?.translations?.en?.title}
                        maxLength={200}
                      />
                    </label>
                    <label>
                      {tr("Mô tả tiếng Anh", "English description")}
                      <textarea
                        name="description_en"
                        defaultValue={editing?.translations?.en?.description}
                      />
                    </label>
                    <label className="checkbox">
                      <input
                        name="published"
                        type="checkbox"
                        defaultChecked={editing?.published}
                      />{" "}
                      {tr("Xuất bản cho học viên")}
                    </label>
                    <button disabled={busy} className="button full">
                      {tr("Lưu khóa học")}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        className="button ghost full"
                        onClick={() => setEditing(null)}
                      >
                        {tr("Hủy chỉnh sửa")}
                      </button>
                    )}
                  </form>
                </section>
              </div>
              {course && (
                <div className="panel spaced">
                  <div className="section-title">
                    <h2>
                      {tr("Bài học ·")}{" "}
                      {data.courses.find((c: any) => c.id === course)?.title}
                    </h2>
                    <button
                      className="button ghost small"
                      onClick={() => setCourse("")}
                    >
                      {tr("Đóng")}
                    </button>
                  </div>
                  <div className="content-columns">
                    <div>
                      {data.lessons
                        .filter((l: any) => l.course_id === course)
                        .map((l: any) => (
                          <button
                            className="draft-row full"
                            key={l.id}
                            onClick={async () => {
                              try {
                                setLessonEdit(
                                  await api(base + "/lessons/" + l.id),
                                );
                              } catch (e) {
                                setError((e as Error).message);
                              }
                            }}
                          >
                            <BookOpen size={17} />
                            {l.position + 1}. {l.title}
                            <span>{tr("Chỉnh sửa ↗")}</span>
                          </button>
                        ))}
                    </div>
                    <form key={lessonEdit?.id || course} onSubmit={saveLesson}>
                      <h3>
                        {lessonEdit ? tr("Sửa bài học") : tr("Thêm bài học")}
                      </h3>
                      <label>
                        {tr("Tiêu đề")}
                        <input
                          name="title"
                          required
                          defaultValue={lessonEdit?.title}
                        />
                      </label>
                      <LessonEditor
                        key={lessonEdit?.id || course}
                        initial={lessonEdit}
                      />
                      <label>
                        {tr("Video HTTPS (tùy chọn)")}
                        <input
                          name="video_url"
                          type="url"
                          defaultValue={lessonEdit?.video_url}
                        />
                      </label>
                      <label>
                        {tr("Thứ tự (bắt đầu từ 0)")}
                        <input
                          name="position"
                          type="number"
                          min={0}
                          defaultValue={lessonEdit?.position || 0}
                        />
                      </label>
                      <div className="actions">
                        <button disabled={busy} className="button">
                          {tr("Lưu bài học")}
                        </button>
                        <button
                          type="submit"
                          name="advanced"
                          disabled={busy}
                          className="button ghost"
                        >
                          {tr(
                            "Lưu và mở Studio toàn màn hình",
                            "Save and open full-page Studio",
                          )}{" "}
                          ↗
                        </button>
                      </div>
                      {lessonEdit && (
                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => setLessonEdit(null)}
                        >
                          {tr("Thêm bài mới")}
                        </button>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </>
          )}
          {tab === "paths" && (
            <div className="content-columns">
              <section className="panel">
                <h2>{tr("Lộ trình học tập")}</h2>
                {!data.paths.length ? (
                  <Empty
                    title={tr("Tạo một hành trình rõ ràng")}
                    body={tr(
                      "Chọn các khóa học theo thứ tự học viên cần hoàn thành.",
                    )}
                  />
                ) : (
                  data.paths.map((p: any) => (
                    <article className="admin-course" key={p.id}>
                      <h3>{p.title}</h3>
                      <div className="actions">
                        <button
                          className="button ghost small"
                          onClick={() => {
                            setPathEdit(p);
                            setPathCourses(p.course_ids);
                          }}
                        >
                          {tr("Chỉnh sửa")}
                        </button>
                        <button
                          className="button ghost small"
                          onClick={() => {
                            if (confirm(tr("Xóa lộ trình này?")))
                              action(
                                () =>
                                  api(base + "/paths/" + p.id, {
                                    method: "DELETE",
                                  }),
                                tr("Đã xóa lộ trình."),
                              );
                          }}
                        >
                          {tr("Xóa")}
                        </button>
                      </div>
                      <ol className="path-list">
                        {p.course_ids.map((id: string) => (
                          <li key={id}>
                            {data.courses.find((c: any) => c.id === id)?.title}
                          </li>
                        ))}
                      </ol>
                    </article>
                  ))
                )}
              </section>
              <form
                className="panel"
                onSubmit={(e) => {
                  const f = fdata(e);
                  action(
                    () =>
                      api(
                        base + "/paths" + (pathEdit ? "/" + pathEdit.id : ""),
                        {
                          method: pathEdit ? "PUT" : "POST",
                          body: JSON.stringify({
                            title: f.get("title"),
                            course_ids: pathCourses,
                          }),
                        },
                      ),
                    tr("Đã tạo lộ trình."),
                  );
                }}
              >
                <h2>
                  {pathEdit ? tr("Chỉnh sửa lộ trình") : tr("Lộ trình mới")}
                </h2>
                <label>
                  {tr("Tên lộ trình")}
                  <input
                    key={pathEdit?.id || "new"}
                    name="title"
                    required
                    defaultValue={pathEdit?.title}
                  />
                </label>
                <p>{tr("Chọn theo thứ tự. Nhấn lại để bỏ chọn.")}</p>
                {data.courses.map((c: any) => (
                  <button
                    className={
                      "path-choice " +
                      (pathCourses.includes(c.id) ? "selected" : "")
                    }
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setPathCourses(
                        pathCourses.includes(c.id)
                          ? pathCourses.filter((x) => x !== c.id)
                          : [...pathCourses, c.id],
                      )
                    }
                  >
                    <span>
                      {pathCourses.indexOf(c.id) >= 0
                        ? pathCourses.indexOf(c.id) + 1
                        : "+"}
                    </span>
                    {c.title}
                  </button>
                ))}
                <button
                  className="button full"
                  disabled={!pathCourses.length || busy}
                >
                  {pathEdit ? tr("Lưu thay đổi") : tr("Tạo lộ trình")}
                </button>
                {pathEdit && (
                  <button
                    type="button"
                    className="button ghost full"
                    onClick={() => {
                      setPathEdit(null);
                      setPathCourses([]);
                    }}
                  >
                    {tr("Tạo lộ trình khác")}
                  </button>
                )}
              </form>
            </div>
          )}
          {tab === "members" && (
            <div className="content-columns">
              <div className="panel">
                <h2>{tr("Thành viên hệ thống")}</h2>
                {data.members.map((m: any) => (
                  <div className="member-row" key={m.id}>
                    <span className="avatar">{m.name[0]}</span>
                    <div>
                      <b>{m.name}</b>
                      <small>{m.email}</small>
                    </div>
                    <span className="pill">{m.role}</span>
                  </div>
                ))}
              </div>
              {data.role === "owner" && (
                <form
                  className="panel"
                  onSubmit={(e) => {
                    const f = fdata(e);
                    action(
                      () =>
                        api(base + "/members", {
                          method: "POST",
                          body: JSON.stringify({
                            email: f.get("email"),
                            role: f.get("role"),
                          }),
                        }),
                      tr("Đã cập nhật quyền."),
                    );
                  }}
                >
                  <h2>{tr("Phân quyền thành viên")}</h2>
                  <p>
                    {tr(
                      "Người dùng cần đăng ký tài khoản trước. Học viên có thể tự tham gia tại website của hệ thống.",
                    )}
                  </p>
                  <label>
                    Email
                    <input type="email" name="email" required />
                  </label>
                  <label>
                    {tr("Vai trò")}
                    <select name="role">
                      <option value="learner">{tr("Học viên")}</option>
                      <option value="instructor">{tr("Giảng viên")}</option>
                      <option value="admin">{tr("Quản trị")}</option>
                    </select>
                  </label>
                  <button className="button" disabled={busy}>
                    {tr("Cập nhật quyền")}
                  </button>
                </form>
              )}
            </div>
          )}
          {tab === "extensions" && (
            <>
              <div className="notice">
                {tr(
                  "Tiện ích first-party được tích hợp sẵn. Chưa hỗ trợ tải/chạy mã bên thứ ba.",
                )}
              </div>
              <div className="extension-grid">
                {catalog.map((p) => {
                  const enabled = data.extensions.some(
                    (x: any) => x.package_id === p.package_id && x.enabled,
                  );
                  return (
                    <article
                      className="panel extension-card"
                      key={p.package_id}
                    >
                      <span className="feature-icon">
                        <Puzzle />
                      </span>
                      <span className="pill">{p.kind}</span>
                      <h2>{tr(p.name)}</h2>
                      <p>{tr(p.description)}</p>
                      <button
                        className={"button " + (enabled ? "ghost" : "")}
                        disabled={busy}
                        onClick={() =>
                          action(
                            () =>
                              api(base + "/extensions/" + p.package_id, {
                                method: "PUT",
                                body: JSON.stringify({ enabled: !enabled }),
                              }),
                            enabled
                              ? tr("Đã tắt tiện ích, dữ liệu vẫn được giữ.")
                              : tr("Đã kích hoạt tiện ích."),
                          )
                        }
                      >
                        {enabled ? tr("Tắt tiện ích") : tr("Kích hoạt")}
                      </button>
                    </article>
                  );
                })}
              </div>
            </>
          )}
          {tab === "export" && (
            <section className="panel export-panel">
              <span className="feature-icon">
                <Download />
              </span>
              <h2>
                {tr("Hệ thống của bạn.")}
                <br />
                {tr("Hạ tầng của bạn.")}
              </h2>
              <p>
                {tr(
                  "Tải mã nguồn web/API và snapshot dữ liệu tenant để triển khai trên database sạch. Tài khoản sẽ được tạo mật khẩu mới khi phục hồi. Không bao gồm session, secret SaaS hay video từ URL ngoài.",
                )}
              </p>
              <div className="notice">
                {tr(
                  "Bản xuất local có checksum, chưa ký bằng khóa phát hành production. Hướng dẫn phục hồi nằm trong RESTORE.md của ZIP.",
                )}
              </div>
              {data.role === "owner" ? (
                <a className="button" href={"/api/v1" + base + "/export"}>
                  {tr("Tải hệ thống ZIP")}
                  <Download size={18} />
                </a>
              ) : (
                <p>{tr("Chỉ chủ sở hữu có quyền xuất dữ liệu.")}</p>
              )}
            </section>
          )}
          {tab === "updates" && (
            <section className="panel export-panel">
              <span className="feature-icon">
                <RefreshCw />
              </span>
              <span className="pill">CORE 0.6.0</span>
              <h2>{tr("Cập nhật có kiểm soát.")}</h2>
              <p>
                {tr(
                  "Chưa cấu hình release registry và khóa tin cậy cho hệ thống này. Tự động cập nhật production chưa được bật.",
                )}
              </p>
              <button
                className="button"
                onClick={() =>
                  action(async () => {
                    const info = await api(base + "/updates");
                    if (!info.configured) throw new Error(info.message);
                  }, tr("Đã kiểm tra cập nhật."))
                }
              >
                {tr("Kiểm tra cấu hình")}
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
