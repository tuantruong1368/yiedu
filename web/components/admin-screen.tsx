"use client";
import { useI18n } from "./locale-provider";
import { studioURL } from "@/lib/studio/types";
import StudioLibrary from "./studio/studio-library";
import { tenantAdminURL } from "@/lib/navigation";
import { Library } from "lucide-react";
import CourseWorkspace from "./course-workspace";
import { useSearchParams } from "next/navigation";
import { TenantBrand } from "./tenant-brand";
import { LocaleSwitch } from "./locale-provider";
import { useEffect, useRef, useState } from "react";
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
export default function AdminScreen({
  slug,
  initialTenant,
}: {
  slug: string;
  initialTenant?: any;
}) {
  const { t: tr, locale } = useI18n();
  const query = useSearchParams();
  const tab = tabs.some(([id]) => id === query.get("tab"))
    ? query.get("tab")!
    : "overview";
  const tabURLs = useRef<Record<string, string>>({});

  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [catalog, setCatalog] = useState<any[]>([]),
    [pathCourses, setPathCourses] = useState<string[]>([]),
    [pathEdit, setPathEdit] = useState<any>(null),
    [contentDirty, setContentDirty] = useState(false);
  const [tenant, setTenant] = useState<any>(
    initialTenant || { slug, name: slug, branding: {} },
  );
  async function refresh() {
    const site = tenant.id ? { tenant } : await api("/sites/" + slug);
    setTenant(site.tenant);
    const d = await api("/runtime/" + site.tenant.id + "/overview");
    setData(d);
    return d;
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    api<any[]>("/catalog/extensions").then(setCatalog);
  }, [slug]);
  function openTab(id: string) {
    const currentTab =
      new URLSearchParams(location.search).get("tab") || "overview";
    if (id === currentTab) return;
    if (
      contentDirty &&
      !confirm(
        tr(
          "Bài học chưa lưu. Rời phần biên tập?",
          "This lesson has unsaved changes. Leave the editor?",
        ),
      )
    )
      return;
    tabURLs.current[currentTab] = location.pathname + location.search;
    history.pushState(
      null,
      "",
      tabURLs.current[id] || tenantAdminURL(slug, id),
    );
    setError("");
    setNotice("");
  }
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
  if (!data)
    return (
      <div className="admin-layout" aria-busy={!error}>
        <aside className="sidebar">
          <TenantBrand tenant={tenant} />
          <div className="tenant-role-label">
            <span className="status-dot" />
            <div>
              <b>{tr("Không gian đào tạo", "Learning workspace")}</b>
              <small>{tr("Đang mở không gian…", "Opening workspace…")}</small>
            </div>
          </div>
          <span className="nav-caption">{tr("KHÔNG GIAN QUẢN TRỊ")}</span>
          <nav>
            {tabs.map(([id, label, Icon]) => (
              <button
                type="button"
                key={id}
                className={id === tab ? "active" : ""}
                disabled
              >
                <Icon size={18} />
                {tr(label)}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <Link href="/dashboard">{tr("Không gian của tôi")}</Link>
          </div>
        </aside>
        <div className="admin-main">
          <header className="admin-top">
            <span>
              {tenant.name}
              <ChevronRight size={13} />
              {tr(tabs.find((x) => x[0] === tab)?.[1] || "")}
            </span>
            <LocaleSwitch />
          </header>
          <main className="admin-content">
            <div className="page-heading">
              <div>
                <span className="eyebrow">{tr("QUẢN TRỊ HỆ THỐNG")}</span>
                <h1>
                  {tr(tabs.find((x) => x[0] === tab)?.[1] || "")}
                  <span className="brand-dot">.</span>
                </h1>
              </div>
            </div>
            <ErrorBox message={error} />
            {error ? (
              <div className="empty">
                <h2>{tr("Chưa thể mở trang quản trị")}</h2>
                <p>{tr("Đăng nhập bằng tài khoản có quyền của tenant.")}</p>
                <div className="actions">
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => {
                      setError("");
                      refresh().catch((e) => setError(e.message));
                    }}
                  >
                    {tr("Thử lại", "Try again")}
                  </button>
                  <Link
                    className="button"
                    href={`/login?site=${slug}&returnTo=${encodeURIComponent(`/t/${slug}/administrator${query.size ? `?${query}` : ""}`)}`}
                  >
                    {tr("Đăng nhập")}
                  </Link>
                </div>
              </div>
            ) : (
              <div
                className="admin-panel-skeleton"
                role="status"
                aria-label={tr("Đang tải không gian của bạn…")}
              >
                <div />
                <div />
                <div />
              </div>
            )}
          </main>
        </div>
      </div>
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
        <div className="tenant-role-label">
          <span className="status-dot" />
          <div>
            <b>{tr("Không gian đào tạo", "Learning workspace")}</b>
            <small>
              {tr(
                data.role === "instructor"
                  ? "Giảng viên"
                  : data.role === "owner"
                    ? "Chủ hệ thống"
                    : "Quản trị viên",
                data.role === "instructor"
                  ? "Instructor"
                  : data.role === "owner"
                    ? "Owner"
                    : "Administrator",
              )}
            </small>
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
                onClick={() => openTab(id)}
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
        <main
          className={`admin-content ${tab === "courses" ? "admin-courses-content" : tab === "studio" ? "admin-studio-content" : ""}`}
        >
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
          {tab === "studio" && <StudioLibrary overview={data} />}
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
                  <button onClick={() => openTab("courses")}>
                    <BookOpen />
                    <b>{tr("Tạo bài học đầu tiên")}</b>
                    <span>{tr("Chia sẻ điều bạn biết với học viên.")}</span>
                  </button>
                  <button onClick={() => openTab("paths")}>
                    <Route />
                    <b>{tr("Thiết kế một lộ trình")}</b>
                    <span>{tr("Đưa học viên đi từng bước rõ ràng.")}</span>
                  </button>
                  <button onClick={() => openTab("extensions")}>
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
            <CourseWorkspace
              data={data}
              onRefresh={refresh}
              onDirty={setContentDirty}
            />
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
              <span className="pill">CORE 0.8.0</span>
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
