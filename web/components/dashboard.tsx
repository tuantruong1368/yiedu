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
} from "lucide-react";
import { api, slugify } from "@/lib/api";
import { Header, Logout, ErrorBox, Loading, Empty } from "./shared";
export default function Dashboard({ template = "" }: { template?: string }) {
  const { t: tr } = useI18n();
  const router = useRouter();

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
            <Logout />
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
                  {data.sites.map((s: any) => (
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
                        <Link href={"/t/" + s.slug}>
                          {s.slug}.yiedu.vn <ArrowUpRight size={12} />
                        </Link>
                      </div>
                      <Link
                        className="button small ghost"
                        href={
                          "/t/" +
                          s.slug +
                          (s.role === "learner" ? "/learn" : "/administrator")
                        }
                      >
                        {s.role === "learner" ? tr("Vào học") : tr("Quản trị")}
                        <ArrowRight size={15} />
                      </Link>
                    </article>
                  ))}
                </div>
              )}
              <h2 className="spaced">{tr("Bản thiết kế")}</h2>
              {data.workspaces.map((w: any) => (
                <Link
                  className="draft-row"
                  key={w.id}
                  href={"/builder/" + w.id}
                >
                  <PencilRuler size={20} />
                  <div>
                    <b>{w.name}</b>
                    <small>
                      {w.template_id}
                      {tr("· Phiên bản")}
                      {w.revision}
                    </small>
                  </div>
                  <span>
                    {w.tenant_id ? tr("Đã xuất bản") : tr("Bản nháp")}
                  </span>
                  <ArrowUpRight size={17} />
                </Link>
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
