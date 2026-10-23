"use client";
import { useEffect, useState } from "react";
import { Puck, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Save, Globe2 } from "lucide-react";
import { api } from "@/lib/api";
import { makeConfig } from "./page-blocks";
import { ErrorBox, Loading } from "./shared";
export default function Builder({ id }: { id: string }) {
  const [w, setW] = useState<any>(null),
    [page, setPage] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  useEffect(() => {
    api("/workspaces/" + id)
      .then((x) => {
        setW(x);
        setPage(x.data);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  async function save(publish = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const saved = await api("/workspaces/" + id, {
        method: "PUT",
        body: JSON.stringify({
          name: w.name,
          slug: w.slug,
          data: page,
          revision: w.revision,
        }),
      });
      setW(saved);
      if (publish) {
        const result = await api("/workspaces/" + id + "/publish", {
          method: "POST",
        });
        setW(result.workspace);
        setNotice("Đã xuất bản website.");
      } else setNotice("Đã lưu bản nháp.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!w || !page)
    return (
      <>
        <ErrorBox message={error} />
        <Loading />
      </>
    );
  return (
    <div className="builder-shell">
      <header className="builder-top">
        <Link href="/dashboard" className="text-link">
          <ArrowLeft size={17} /> Không gian của tôi
        </Link>
        <div>
          <b>{w.name}</b>
          <small>
            {w.slug}.yiedu.vn · v{w.revision}
          </small>
        </div>
        <div className="actions">
          {w.tenant_id && (
            <Link
              href={"/t/" + w.slug}
              className="button ghost small"
              target="_blank"
            >
              <ExternalLink size={16} /> Xem trang
            </Link>
          )}
          <button
            className="button ghost small"
            disabled={busy}
            onClick={() => save()}
          >
            <Save size={16} /> Lưu nháp
          </button>
          <button
            className="button small"
            disabled={busy}
            onClick={() => save(true)}
          >
            <Globe2 size={16} />
            {busy ? "Đang lưu…" : "Xuất bản"}
          </button>
        </div>
      </header>
      <div className="builder-identity">
        <label>
          Tên hệ thống
          <input
            value={w.name}
            onChange={(e) => setW({ ...w, name: e.target.value })}
          />
        </label>
        <label>
          Địa chỉ
          <input
            value={w.slug}
            disabled={!!w.tenant_id}
            onChange={(e) => setW({ ...w, slug: e.target.value })}
          />
        </label>
        <span>Thêm và kéo thả khối nội dung ở phía dưới.</span>
      </div>
      <ErrorBox message={error} />
      {notice && (
        <div role="status" className="notice">
          {notice} <Link href={"/t/" + w.slug}>Mở website ↗</Link>
        </div>
      )}
      <Puck
        config={makeConfig()}
        data={page}
        onChange={setPage}
        onPublish={() => save(true)}
      />
    </div>
  );
}
