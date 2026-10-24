"use client";
import { useI18n } from "./locale-provider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Code2, Package, ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { Header, ErrorBox } from "./shared";
const example = {
  schema_version: "0.1",
  package_id: "yourname.training-theme",
  kind: "template",
  version: "0.1.0",
  display_name: "Training theme",
  core: { min_inclusive: "0.1.0", max_exclusive: "1.0.0" },
  extension_api: { min_inclusive: "0.1.0", max_exclusive: "0.2.0" },
  surfaces: ["web"],
  capabilities: ["pages:read"],
  dependencies: [],
  portable: true,
  data_schema_version: "0.1.0",
};
export default function Developer() {
  const { t: tr } = useI18n();

  const [list, setList] = useState<any[]>([]),
    [error, setError] = useState(""),
    [manifest, setManifest] = useState(JSON.stringify(example, null, 2)),
    [notice, setNotice] = useState("");
  useEffect(() => {
    api<any[]>("/developer/packages")
      .then(setList)
      .catch(() =>
        setError(tr("Đăng nhập để gửi package và quản lý hồ sơ developer.")),
      );
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    try {
      await api("/developer/packages", {
        method: "POST",
        body: JSON.stringify({
          manifest: JSON.parse(manifest),
          description: f.get("description"),
        }),
      });
      setList(await api("/developer/packages"));
      setNotice(
        tr(
          "Đã gửi metadata. Package đang chờ review; chưa được phân phối hoặc chạy trên tenant.",
        ),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Header />
      <main className="workspace">
        <div className="page-heading">
          <div>
            <span className="eyebrow">YIEDU DEVELOPERS</span>
            <h1>
              {tr("Cùng xây khả năng mới")}
              <span className="brand-dot">.</span>
            </h1>
            <p>
              {tr("Template, component và plugin cho hệ sinh thái học tập.")}
            </p>
          </div>
          <Link className="button ghost" href="/login">
            {tr("Đăng nhập ↗")}
          </Link>
        </div>
        <div className="notice">
          {tr(
            "Developer portal hiện nhận và kiểm tra metadata manifest. Artifact upload, review ký phát hành, mua bán và payout chưa được bật.",
          )}
        </div>
        <div className="content-columns">
          <section className="panel">
            <h2>
              <Package size={22} />
              {tr("Package của bạn")}
            </h2>
            {!list.length ? (
              <p>{tr("Chưa có package được gửi.")}</p>
            ) : (
              list.map((p) => (
                <article className="admin-course" key={p.id}>
                  <h3>{p.manifest.display_name}</h3>
                  <p>
                    {p.package_id} · {p.manifest.version}
                  </p>
                  <span className="pill">{p.status}</span>
                </article>
              ))
            )}
            <h3 className="spaced">{tr("Bắt đầu với hợp đồng rõ ràng.")}</h3>
            <p>
              {tr(
                "Manifest có version, range tương thích, capability và surface. Việc kiểm tra metadata không thay thế kiểm tra code, giấy phép và bảo mật.",
              )}
            </p>
            <a
              className="text-link"
              href="https://github.com/tuantruong1368/yiedu/blob/main/handbook/guides/developer-quickstart.md"
              target="_blank"
              rel="noreferrer"
            >
              {tr("Đọc developer quickstart")}
              <ArrowUpRight size={16} />
            </a>
          </section>
          <form className="panel" onSubmit={submit}>
            <h2>
              <Code2 size={22} />
              {tr("Gửi metadata package")}
            </h2>
            <label>
              Manifest JSON
              <textarea
                className="code-input"
                rows={20}
                value={manifest}
                onChange={(e) => setManifest(e.target.value)}
              />
            </label>
            <label>
              {tr("Mô tả")}
              <textarea name="description" rows={3} />
            </label>
            <ErrorBox message={error} />
            {notice && <p className="notice">{notice}</p>}
            <button className="button">
              {tr("Gửi để review")}
              <ArrowUpRight size={17} />
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
