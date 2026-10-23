"use client";
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
  ["paths", "Lộ trình", Route],
  ["members", "Thành viên", Users],
  ["extensions", "Tiện ích", Puzzle],
  ["export", "Xuất hệ thống", Download],
  ["updates", "Cập nhật", RefreshCw],
] as const;
export default function AdminScreen({ slug }: { slug: string }) {
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
  async function refresh() {
    const site = await api("/sites/" + slug);
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
          }),
        }),
      "Đã lưu khóa học.",
    );
    if (!success) return;
    setEditing(null);
    (document.getElementById("course-form") as HTMLFormElement)?.reset();
  }
  async function saveLesson(e: React.FormEvent<HTMLFormElement>) {
    const f = fdata(e);
    const success = await action(
      () =>
        api(
          base +
            (lessonEdit
              ? "/lessons/" + lessonEdit.id
              : "/courses/" + course + "/lessons"),
          {
            method: lessonEdit ? "PUT" : "POST",
            body: JSON.stringify({
              title: f.get("title"),
              content: f.get("content"),
              video_url: f.get("video_url"),
              position: Number(f.get("position")),
            }),
          },
        ),
      "Đã lưu bài học.",
    );
    if (success) setLessonEdit(null);
  }
  if (!data)
    return (
      <>
        <header className="topbar">
          <Brand />
          <Link href="/dashboard">Về dashboard</Link>
        </header>
        <ErrorBox message={error} />
        {error ? (
          <div className="empty">
            <h2>Chưa thể mở trang quản trị</h2>
            <p>Đăng nhập bằng tài khoản có quyền của tenant.</p>
            <Link className="button" href="/login">
              Đăng nhập
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
        <h2>Bạn đang là học viên.</h2>
        <Link className="button" href={"/t/" + slug + "/learn"}>
          Vào không gian học tập
        </Link>
      </div>
    );
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <Brand />
        <div className="tenant-label">
          <span style={{ background: data.tenant.branding.color || "#215d4c" }}>
            {data.tenant.name[0]}
          </span>
          <div>
            <b>{data.tenant.name}</b>
            <small>{data.role.toUpperCase()}</small>
          </div>
        </div>
        <span className="nav-caption">KHÔNG GIAN QUẢN TRỊ</span>
        <nav>
          {tabs
            .filter(
              ([id]) =>
                data.role !== "instructor" ||
                ["overview", "courses", "paths"].includes(id),
            )
            .map(([id, label, Icon]) => (
              <button
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => {
                  setTab(id);
                  setError("");
                  setNotice("");
                }}
              >
                <Icon size={18} />
                {label}
                {tab === id && <ChevronRight size={15} />}
              </button>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/dashboard">
            <Layers3 size={17} /> Không gian của tôi
          </Link>
          <Link href={"/t/" + slug} target="_blank">
            <Globe2 size={17} /> Xem website <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <span>
            {data.tenant.name} <ChevronRight size={13} />{" "}
            {tabs.find((t) => t[0] === tab)?.[1]}
          </span>
          <div className="actions">
            <Link href={"/t/" + slug + "/learn"} className="text-link">
              <GraduationCap size={17} /> Khu học tập
            </Link>
            <Logout />
          </div>
        </header>
        <main className="admin-content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">QUẢN TRỊ HỆ THỐNG</span>
              <h1>
                {tabs.find((t) => t[0] === tab)?.[1]}
                <span className="brand-dot">.</span>
              </h1>
              <p>
                {tab === "overview"
                  ? "Một góc nhìn rõ ràng để bạn tiếp tục phát triển."
                  : "Tổ chức nội dung, theo dõi và làm chủ hệ thống của bạn."}
              </p>
            </div>
            <span className="pill">
              <span className="status-dot" /> Đang hoạt động
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
                  <span>Khóa học</span>
                </div>
                <div>
                  <Route />
                  <b>{data.paths.length}</b>
                  <span>Lộ trình</span>
                </div>
                <div>
                  <Users />
                  <b>{data.members.length}</b>
                  <span>Thành viên</span>
                </div>
              </div>
              <div className="panel">
                <div className="section-title">
                  <h2>Tiếp tục xây hệ thống</h2>
                  <Link href={"/t/" + slug} className="text-link">
                    Xem website ↗
                  </Link>
                </div>
                <div className="quick-actions">
                  <button onClick={() => setTab("courses")}>
                    <BookOpen />
                    <b>Tạo bài học đầu tiên</b>
                    <span>Chia sẻ điều bạn biết với học viên.</span>
                  </button>
                  <button onClick={() => setTab("paths")}>
                    <Route />
                    <b>Thiết kế một lộ trình</b>
                    <span>Đưa học viên đi từng bước rõ ràng.</span>
                  </button>
                  <button onClick={() => setTab("extensions")}>
                    <Puzzle />
                    <b>Mở rộng khả năng</b>
                    <span>Kích hoạt tiện ích cho hệ thống.</span>
                  </button>
                </div>
              </div>
              <div className="panel">
                <h2>Hoạt động gần đây</h2>
                {!data.events.length ? (
                  <p>Chưa có hoạt động được ghi nhận.</p>
                ) : (
                  data.events.slice(0, 8).map((e: any) => (
                    <div className="activity-row" key={e.id}>
                      <span className="status-dot" />
                      <b>{e.event_type}</b>
                      <small>
                        {new Date(e.created_at).toLocaleString("vi-VN")}
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
                    <h2>Danh sách khóa học</h2>
                    <span className="pill">{data.courses.length}</span>
                  </div>
                  {!data.courses.length ? (
                    <Empty
                      title="Khóa học đầu tiên đang chờ bạn"
                      body="Tạo nội dung bên phải để bắt đầu."
                    />
                  ) : (
                    data.courses.map((c: any) => (
                      <article className="admin-course" key={c.id}>
                        <div>
                          <span
                            className={"pill " + (c.published ? "green" : "")}
                          >
                            {c.published ? "Đã xuất bản" : "Bản nháp"}
                          </span>
                          <h3>{c.title}</h3>
                          <p>{c.description}</p>
                          <small>
                            {
                              data.lessons.filter(
                                (l: any) => l.course_id === c.id,
                              ).length
                            }{" "}
                            bài học
                          </small>
                        </div>
                        <div className="actions">
                          <button
                            className="button ghost small"
                            onClick={() => setEditing(c)}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            className="button small"
                            onClick={() => {
                              setCourse(c.id);
                              setLessonEdit(null);
                            }}
                          >
                            Bài học
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </section>
                <section className="panel">
                  <h2>{editing ? "Chỉnh sửa khóa học" : "Tạo khóa học"}</h2>
                  <form
                    id="course-form"
                    key={editing?.id || "new"}
                    onSubmit={saveCourse}
                  >
                    <label>
                      Tên khóa học
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
                      Đường dẫn
                      <input
                        name="slug"
                        defaultValue={editing?.slug}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        required
                      />
                    </label>
                    <label>
                      Mô tả
                      <textarea
                        name="description"
                        defaultValue={editing?.description}
                        rows={4}
                      />
                    </label>
                    <label className="checkbox">
                      <input
                        name="published"
                        type="checkbox"
                        defaultChecked={editing?.published}
                      />{" "}
                      Xuất bản cho học viên
                    </label>
                    <button disabled={busy} className="button full">
                      Lưu khóa học
                    </button>
                    {editing && (
                      <button
                        type="button"
                        className="button ghost full"
                        onClick={() => setEditing(null)}
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </form>
                </section>
              </div>
              {course && (
                <div className="panel spaced">
                  <div className="section-title">
                    <h2>
                      Bài học ·{" "}
                      {data.courses.find((c: any) => c.id === course)?.title}
                    </h2>
                    <button
                      className="button ghost small"
                      onClick={() => setCourse("")}
                    >
                      Đóng
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
                            <span>Chỉnh sửa ↗</span>
                          </button>
                        ))}
                    </div>
                    <form key={lessonEdit?.id || course} onSubmit={saveLesson}>
                      <h3>{lessonEdit ? "Sửa bài học" : "Thêm bài học"}</h3>
                      <label>
                        Tiêu đề
                        <input
                          name="title"
                          required
                          defaultValue={lessonEdit?.title}
                        />
                      </label>
                      <label>
                        Nội dung
                        <textarea
                          name="content"
                          rows={7}
                          defaultValue={lessonEdit?.content}
                        />
                      </label>
                      <label>
                        Video HTTPS (tùy chọn)
                        <input
                          name="video_url"
                          type="url"
                          defaultValue={lessonEdit?.video_url}
                        />
                      </label>
                      <label>
                        Thứ tự (bắt đầu từ 0)
                        <input
                          name="position"
                          type="number"
                          min={0}
                          defaultValue={lessonEdit?.position || 0}
                        />
                      </label>
                      <button disabled={busy} className="button">
                        Lưu bài học
                      </button>
                      {lessonEdit && (
                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => setLessonEdit(null)}
                        >
                          Thêm bài mới
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
                <h2>Lộ trình học tập</h2>
                {!data.paths.length ? (
                  <Empty
                    title="Tạo một hành trình rõ ràng"
                    body="Chọn các khóa học theo thứ tự học viên cần hoàn thành."
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
                          Chỉnh sửa
                        </button>
                        <button
                          className="button ghost small"
                          onClick={() => {
                            if (confirm("Xóa lộ trình này?"))
                              action(
                                () =>
                                  api(base + "/paths/" + p.id, {
                                    method: "DELETE",
                                  }),
                                "Đã xóa lộ trình.",
                              );
                          }}
                        >
                          Xóa
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
                    "Đã tạo lộ trình.",
                  );
                }}
              >
                <h2>{pathEdit ? "Chỉnh sửa lộ trình" : "Lộ trình mới"}</h2>
                <label>
                  Tên lộ trình
                  <input
                    key={pathEdit?.id || "new"}
                    name="title"
                    required
                    defaultValue={pathEdit?.title}
                  />
                </label>
                <p>Chọn theo thứ tự. Nhấn lại để bỏ chọn.</p>
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
                  {pathEdit ? "Lưu thay đổi" : "Tạo lộ trình"}
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
                    Tạo lộ trình khác
                  </button>
                )}
              </form>
            </div>
          )}
          {tab === "members" && (
            <div className="content-columns">
              <div className="panel">
                <h2>Thành viên hệ thống</h2>
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
                      "Đã cập nhật quyền.",
                    );
                  }}
                >
                  <h2>Phân quyền thành viên</h2>
                  <p>
                    Người dùng cần đăng ký tài khoản trước. Học viên có thể tự
                    tham gia tại website của hệ thống.
                  </p>
                  <label>
                    Email
                    <input type="email" name="email" required />
                  </label>
                  <label>
                    Vai trò
                    <select name="role">
                      <option value="learner">Học viên</option>
                      <option value="instructor">Giảng viên</option>
                      <option value="admin">Quản trị</option>
                    </select>
                  </label>
                  <button className="button" disabled={busy}>
                    Cập nhật quyền
                  </button>
                </form>
              )}
            </div>
          )}
          {tab === "extensions" && (
            <>
              <div className="notice">
                Tiện ích first-party được tích hợp sẵn. Chưa hỗ trợ tải/chạy mã
                bên thứ ba.
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
                      <h2>{p.name}</h2>
                      <p>{p.description}</p>
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
                              ? "Đã tắt tiện ích, dữ liệu vẫn được giữ."
                              : "Đã kích hoạt tiện ích.",
                          )
                        }
                      >
                        {enabled ? "Tắt tiện ích" : "Kích hoạt"}
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
                Hệ thống của bạn.
                <br />
                Hạ tầng của bạn.
              </h2>
              <p>
                Tải mã nguồn web/API và snapshot dữ liệu tenant để triển khai
                trên database sạch. Tài khoản sẽ được tạo mật khẩu mới khi phục
                hồi. Không bao gồm session, secret SaaS hay video từ URL ngoài.
              </p>
              <div className="notice">
                Bản xuất local có checksum, chưa ký bằng khóa phát hành
                production. Hướng dẫn phục hồi nằm trong RESTORE.md của ZIP.
              </div>
              {data.role === "owner" ? (
                <a className="button" href={"/api/v1" + base + "/export"}>
                  Tải hệ thống ZIP <Download size={18} />
                </a>
              ) : (
                <p>Chỉ chủ sở hữu có quyền xuất dữ liệu.</p>
              )}
            </section>
          )}
          {tab === "updates" && (
            <section className="panel export-panel">
              <span className="feature-icon">
                <RefreshCw />
              </span>
              <span className="pill">CORE 0.3.0</span>
              <h2>Cập nhật có kiểm soát.</h2>
              <p>
                Chưa cấu hình release registry và khóa tin cậy cho hệ thống này.
                Tự động cập nhật production chưa được bật.
              </p>
              <button
                className="button"
                onClick={() =>
                  action(async () => {
                    const info = await api(base + "/updates");
                    if (!info.configured) throw new Error(info.message);
                  }, "Đã kiểm tra cập nhật.")
                }
              >
                Kiểm tra cấu hình
              </button>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
