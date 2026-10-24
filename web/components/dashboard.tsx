"use client";
import { useRouter } from "next/navigation";
import { useI18n } from "./locale-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Globe2,
  Plus,
  PencilRuler,
  BookOpen,
  Pencil,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Receipt,
} from "lucide-react";
import { api, slugify } from "@/lib/api";
import { Header, Logout, ErrorBox, Loading, Empty } from "./shared";
export default function Dashboard({ template = "" }: { template?: string }) {
  const { t: tr } = useI18n();
  const router = useRouter();

  const [trash, setTrash] = useState(false),
    [managing, setManaging] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [creating, setCreating] = useState(false),
    [selected, setSelected] = useState(template || "academy");
  useEffect(() => {
    api("/catalog/templates")
      .then(setTemplates)
      .catch((e) => setError(e.message));
    api("/me/dashboard")
      .then(setData)
      .catch(() => router.replace("/login"));
  }, []);
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setCreating(true);
    const f = new FormData(e.currentTarget);
    try {
      const w = await api("/workspaces", {
        method: "POST",
        body: JSON.stringify({
          name: f.get("name"),
          slug: f.get("slug"),
          template_id: selected,
          include_sample_content: f.get("include_sample_content") === "on",
        }),
      });
      router.push("/builder/" + w.id);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  }
  async function archive(kind: string, id: string, archived: boolean) {
    if (
      archived &&
      !confirm(
        tr(
          kind === "site"
            ? "Chuyển hệ thống vào thùng rác? Website sẽ tạm ẩn; dữ liệu được giữ để khôi phục."
            : "Chuyển bản thiết kế vào thùng rác? Website đã xuất bản vẫn được giữ.",
          kind === "site"
            ? "Archive this system? The public website will be hidden and data preserved for restoration."
            : "Archive this design? Its published website will be preserved.",
        ),
      )
    )
      return;
    setManaging(id);
    setError("");
    try {
      await api(
        (kind === "site" ? "/me/sites/" : "/workspaces/") + id + "/archive",
        { method: "PUT", body: JSON.stringify({ archived }) },
      );
      setData(await api("/me/dashboard"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setManaging("");
    }
  }
  async function editSite(id: string) {
    setManaging(id);
    setError("");
    try {
      const w = await api(`/me/sites/${id}/design`, { method: "POST" });
      router.push(`/builder/${w.id}`);
    } catch (e) {
      setError((e as Error).message);
      setManaging("");
    }
  }
  return (
    <>
      <Header />
      {!data ? (
        <Loading />
      ) : (
        <main className="workspace">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{tr("KHÔNG GIAN CỦA BẠN")}</span>
              <h1>
                {tr("Xin chào,")}
                {data.user.name.split(" ").at(-1)}
                <span className="brand-dot">.</span>
              </h1>
              <p>{tr("Mỗi bài học là khởi đầu của một điều mới.")}</p>
            </div>
            <div className="actions">
              {data.user.platform_admin && (
                <Link href="/platform" className="button small">
                  <ShieldCheck size={16} />
                  {tr("Quản trị YiEdu", "YiEdu administration")}
                </Link>
              )}
              <Link href="/orders" className="button small ghost">
                <Receipt size={16} />
                {tr("Đơn hàng", "Orders")}
              </Link>
              <Logout />
            </div>
          </div>
          <div className="stats-row">
            <div>
              <Globe2 />
              <b>{data.sites.length}</b>
              <span>{tr("Hệ thống đã tham gia")}</span>
            </div>
            <div>
              <PencilRuler />
              <b>{data.workspaces.length}</b>
              <span>{tr("Bản thiết kế")}</span>
            </div>
            <div>
              <BookOpen />
              <b>YiEdu</b>
              <span>{tr("Học tập & phát triển")}</span>
            </div>
          </div>
          <ErrorBox message={error} />
          <div className="dashboard-toolbar">
            <button
              className={`button small ${trash ? "" : "ghost"}`}
              onClick={() => setTrash(!trash)}
            >
              <Trash2 size={15} />
              {trash
                ? tr("Trở về đang hoạt động", "Back to active items")
                : tr("Thùng rác", "Trash")}
            </button>
            <small>
              {tr(
                "Có thể khôi phục nội dung đã xóa trong thùng rác.",
                "Archived items can be restored from the trash.",
              )}
            </small>
          </div>
          <div className="dashboard-columns">
            <section>
              <div className="section-title">
                <h2>{tr("Hệ thống của bạn")}</h2>
                <span className="pill">{data.sites.length}</span>
              </div>
              {!data.sites.length ? (
                <Empty
                  title={tr("Chưa có hệ thống nào")}
                  body={tr(
                    "Tạo không gian đầu tiên hoặc tham gia một hệ thống để bắt đầu học.",
                  )}
                />
              ) : (
                <div className="site-list">
                  {data.sites
                    .filter((s: any) => !!s.archived_at === trash)
                    .map((s: any) => (
                      <article className="site-card" key={s.id}>
                        <div
                          className="site-mark"
                          style={{ background: s.branding.color || "#215d4c" }}
                        >
                          {s.name[0]}
                        </div>
                        <div>
                          <small>{s.role.toUpperCase()}</small>
                          <h3>{s.name}</h3>
                          <Link
                            href={
                              s.is_published === false
                                ? `/t/${s.slug}/administrator?tab=billing`
                                : "/t/" + s.slug
                            }
                          >
                            {s.is_published === false
                              ? tr(
                                  "Chờ kích hoạt / xuất bản",
                                  "Activation / publication pending",
                                )
                              : `${s.slug}.yiedu.vn`}{" "}
                            <ArrowUpRight size={12} />
                          </Link>
                        </div>
                        <div className="site-card-actions">
                          {trash ? (
                            <button
                              className="button small ghost"
                              disabled={!!managing}
                              onClick={() => archive("site", s.id, false)}
                            >
                              <RotateCcw size={15} />
                              {tr("Khôi phục", "Restore")}
                            </button>
                          ) : (
                            <>
                              <Link
                                className="button small ghost"
                                href={
                                  "/t/" +
                                  s.slug +
                                  (s.role === "learner"
                                    ? "/learn"
                                    : "/administrator")
                                }
                              >
                                {s.role === "learner"
                                  ? tr("Vào học")
                                  : tr("Quản trị")}
                                <ArrowRight size={15} />
                              </Link>
                              {["owner", "admin"].includes(s.role) && (
                                <button
                                  className="icon-button"
                                  disabled={!!managing}
                                  onClick={() => editSite(s.id)}
                                  aria-label={tr(
                                    "Chỉnh sửa website",
                                    "Edit website",
                                  )}
                                  title={tr(
                                    "Chỉnh sửa website",
                                    "Edit website",
                                  )}
                                >
                                  <Pencil size={16} />
                                </button>
                              )}
                              {s.role === "owner" && (
                                <button
                                  className="icon-button danger-text"
                                  disabled={!!managing}
                                  onClick={() => archive("site", s.id, true)}
                                  aria-label={tr(
                                    "Xóa hệ thống",
                                    "Archive system",
                                  )}
                                  title={tr("Xóa hệ thống", "Archive system")}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </article>
                    ))}
                </div>
              )}
              <h2 className="spaced">{tr("Bản thiết kế")}</h2>
              {data.workspaces
                .filter((w: any) => !!w.archived_at === trash)
                .map((w: any) => (
                  <article className="draft-row managed-draft-row" key={w.id}>
                    <Link href={"/builder/" + w.id}>
                      <PencilRuler size={20} />
                      <div>
                        <b>{w.name}</b>
                        <small>
                          {w.template_id} · v{w.revision}
                        </small>
                      </div>
                      <span>
                        {w.tenant_id ? tr("Đã xuất bản") : tr("Bản nháp")}
                      </span>
                    </Link>
                    {trash ? (
                      <button
                        className="icon-button"
                        disabled={!!managing}
                        aria-label={tr(
                          "Khôi phục bản thiết kế",
                          "Restore design",
                        )}
                        onClick={() => archive("workspace", w.id, false)}
                      >
                        <RotateCcw size={17} />
                      </button>
                    ) : (
                      <button
                        className="icon-button danger-text"
                        disabled={!!managing}
                        aria-label={tr("Xóa bản thiết kế", "Archive design")}
                        onClick={() => archive("workspace", w.id, true)}
                      >
                        <Trash2 size={17} />
                      </button>
                    )}
                  </article>
                ))}
            </section>
            <aside className="create-panel">
              <span className="eyebrow">{tr("TẠO ĐIỀU TIẾP THEO")}</span>
              <h2>{tr("Không gian mới.")}</h2>
              <p>{tr("Bắt đầu từ một mẫu, rồi biến nó thành của bạn.")}</p>
              <form onSubmit={create}>
                <label>
                  {tr("Tên hệ thống")}
                  <input
                    name="name"
                    required
                    placeholder={tr("Ví dụ: Yisoft Academy")}
                    maxLength={200}
                    onChange={(e) => {
                      const form = e.target.form;
                      if (form)
                        (
                          form.elements.namedItem("slug") as HTMLInputElement
                        ).value = slugify(e.target.value);
                    }}
                  />
                </label>
                <label>
                  {tr("Địa chỉ hệ thống")}
                  <div className="input-addon">
                    <input
                      name="slug"
                      required
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      maxLength={63}
                      placeholder="yisoft"
                    />
                    <span>.yiedu.vn</span>
                  </div>
                </label>
                <label>
                  {tr("Mẫu giao diện")}
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {templates.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name} · {x.course_count} {tr("môn", "courses")}
                      </option>
                    ))}
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      name="include_sample_content"
                      defaultChecked
                    />
                    {tr(
                      "Sao chép bài học và lộ trình mẫu khi xuất bản",
                      "Copy sample lessons and pathways on publish",
                    )}
                  </label>
                </label>
                <ErrorBox message={error} />
                <button className="button full" disabled={creating}>
                  <Plus size={17} />
                  {creating ? tr("Đang tạo…") : tr("Mở trình thiết kế")}
                </button>
              </form>
            </aside>
          </div>
        </main>
      )}
    </>
  );
}
