"use client";
import { useEffect, useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Clock3,
  CheckCircle2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { api, slugify } from "@/lib/api";
import { ErrorBox } from "../shared";
import { useI18n } from "../locale-provider";
export default function AIStudio({
  scope,
  onApplied,
}: {
  scope: string;
  onApplied?: () => void;
}) {
  const { t, locale } = useI18n(),
    platform = scope === "platform",
    [drafts, setDrafts] = useState<any[]>([]),
    [selected, setSelected] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [kind, setKind] = useState(platform ? "template" : "course"),
    [templates, setTemplates] = useState<any[]>([]);
  const load = () => api(`/ai/${scope}/drafts`).then(setDrafts);
  useEffect(() => {
    load().catch((e) => setError(e.message));
    if (platform)
      api("/platform/templates")
        .then(setTemplates)
        .catch(() => {});
  }, [scope]);
  async function generate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    setBusy(true);
    try {
      const d = await api(`/ai/${scope}/generate`, {
        method: "POST",
        body: JSON.stringify({
          kind,
          prompt: f.get("prompt"),
          locale,
          request_key: crypto.randomUUID(),
          base_template: f.get("base_template") || "academy",
        }),
      });
      setSelected(d);
      await load();
    } catch (e) {
      setError((e as Error).message);
      await load();
    } finally {
      setBusy(false);
    }
  }
  async function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(`/ai/${scope}/drafts/${selected.id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          title: f.get("title"),
          template_id: f.get("template_id") || "",
        }),
      });
      await load();
      setSelected({ ...selected, status: "applied" });
      onApplied?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const content = selected?.result?.content;
  return (
    <div className="business-stack">
      <div className="ai-intro">
        <div className="ai-orbit">
          <Sparkles size={32} />
        </div>
        <div>
          <span className="eyebrow">YIEDU AI STUDIO</span>
          <h2>
            {t(
              "Từ ý tưởng đến chương trình học.",
              "From an idea to a learning experience.",
            )}
          </h2>
          <p>
            {t(
              "Mô tả người học, mục tiêu và cách thực hành. AI tạo bản nháp có ví dụ, bài tập, đáp án và slide để bạn kiểm duyệt.",
              "Describe your learners, objectives and practice activities. AI drafts examples, exercises, answers and slides for your review.",
            )}
          </p>
        </div>
      </div>
      <ErrorBox message={error} />
      <div className="ai-workspace">
        <section className="panel">
          <form onSubmit={generate}>
            <label>
              {t("Bạn muốn tạo gì?", "What would you like to create?")}
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="course">
                  {t("Khóa học đầy đủ", "Complete course")}
                </option>
                {platform && (
                  <option value="template">
                    {t(
                      "Website template và khóa học",
                      "Website template with courses",
                    )}
                  </option>
                )}
              </select>
            </label>
            <label>
              {t("Yêu cầu cho AI", "Your brief")}
              <textarea
                name="prompt"
                required
                minLength={15}
                maxLength={6000}
                rows={8}
                placeholder={t(
                  "Ví dụ: Tạo khóa Python cho người mới, 6 bài, mỗi bài có ví dụ chạy được, bài tập và đáp án. Dùng mô phỏng sắp xếp khi phù hợp.",
                  "Example: Create a six-lesson Python course for beginners, with runnable examples, exercises and answers. Use a sorting simulation where relevant.",
                )}
              />
            </label>
            {platform && kind === "template" && (
              <label>
                {t(
                  "Thiết lập website tham chiếu",
                  "Reference website settings",
                )}
                <select name="base_template">
                  {templates
                    .filter((x) => x.status === "published")
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <button className="button full" disabled={busy}>
              <Sparkles size={17} />
              {busy
                ? t(
                    "Đang tạo, có thể mất khoảng 1–2 phút…",
                    "Generating, this can take 1–2 minutes…",
                  )
                : t("Tạo bản nháp bằng AI", "Generate a draft")}
            </button>
            <small className="form-help">
              {t(
                "Dùng API key đã cấu hình. Mỗi lần tạo có thể phát sinh phí từ OpenAI. Nội dung cần được người có chuyên môn kiểm duyệt; không tự xuất bản.",
                "Uses the configured API key. Each generation may incur OpenAI charges. Review accuracy and teaching quality before publishing.",
              )}
            </small>
          </form>
        </section>
        <section className="panel ai-review">
          <div className="section-title">
            <h3>{t("Bản nháp & kiểm duyệt", "Drafts & review")}</h3>
            <button
              className="text-link"
              onClick={() => load().catch((e) => setError(e.message))}
            >
              <RefreshCw size={15} />
              {t("Làm mới", "Refresh")}
            </button>
          </div>
          <div className="ai-draft-list">
            {drafts.map((d) => (
              <button
                key={d.id}
                className={selected?.id === d.id ? "selected" : ""}
                onClick={async () => {
                  try {
                    setSelected(await api(`/ai/${scope}/drafts/${d.id}`));
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <span>
                  {d.status === "applied" ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Clock3 size={16} />
                  )}
                </span>
                <b>
                  {d.title ||
                    d.result?.content?.title ||
                    d.result?.content?.name ||
                    d.prompt.slice(0, 65)}
                </b>
                <small>
                  {t(
                    (
                      {
                        ready: "Sẵn sàng",
                        applied: "Đã áp dụng",
                        failed: "Lỗi",
                        generating: "Đang tạo",
                      } as Record<string, string>
                    )[String(d.status)] || d.status,
                    (
                      {
                        ready: "Ready",
                        applied: "Applied",
                        failed: "Failed",
                        generating: "Generating",
                      } as Record<string, string>
                    )[String(d.status)] || d.status,
                  )}
                </small>
              </button>
            ))}
          </div>
          {!drafts.length && (
            <div className="empty">
              <Sparkles />
              <p>
                {t(
                  "Bản nháp được lưu ở đây để bạn quay lại bất kỳ lúc nào.",
                  "Your drafts will be saved here so you can return later.",
                )}
              </p>
            </div>
          )}
          {selected && (
            <div className="ai-preview">
              {content && (
                <>
                  <h3>{content.title || content.name}</h3>
                  <p>{content.description}</p>
                  {(content.courses || [content]).map((c: any, i: number) => (
                    <div key={i}>
                      <b>{c.title}</b>
                      {c.lessons?.map((l: any, j: number) => (
                        <details key={j}>
                          <summary>
                            {j + 1}. {l.title}
                          </summary>
                          {["explanation", "example", "exercise", "answer"].map(
                            (k) => (
                              <p key={k}>{l[k]}</p>
                            ),
                          )}
                          {l.simulation !== "none" && (
                            <span className="pill">{l.simulation}</span>
                          )}
                        </details>
                      ))}
                    </div>
                  ))}
                </>
              )}
              {selected.status === "ready" && content && (
                <form onSubmit={apply}>
                  <label>
                    {t("Tên sau khi lưu", "Save as")}
                    <input
                      name="title"
                      required
                      maxLength={200}
                      defaultValue={content.title || content.name}
                      key={selected.id}
                    />
                  </label>
                  {platform &&
                    (selected.kind === "template" ? (
                      <label>
                        {t("Mã template mới", "New template identifier")}
                        <input
                          name="template_id"
                          required
                          pattern="[a-z][a-z0-9-]*"
                          maxLength={100}
                          defaultValue={slugify(content.name)}
                          key={selected.id + "id"}
                        />
                      </label>
                    ) : (
                      <label>
                        {t("Thêm vào template", "Append to template")}
                        <select name="template_id" required>
                          {templates.map((x) => (
                            <option key={x.id} value={x.id}>
                              {x.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  <button className="button" disabled={busy}>
                    {t("Đã duyệt · Lưu bản nháp", "Reviewed · Save draft")}
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
              {selected.status === "applied" && (
                <div className="notice">
                  {t(
                    "Đã lưu. Bạn có thể chỉnh sửa và xuất bản tại thư viện.",
                    "Saved. Edit and publish it in your library.",
                  )}
                  {platform && (
                    <Link href="/platform?tab=templates">
                      {t("Mở thư viện template", "Open template library")} ↗
                    </Link>
                  )}
                </div>
              )}
              {selected.status === "failed" && (
                <ErrorBox
                  message={
                    selected.usage?.error ||
                    t("Lần tạo chưa hoàn thành.", "Generation failed.")
                  }
                />
              )}
              <button
                className="text-link danger-text"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(t("Xóa bản nháp AI này?", "Delete this AI draft?"))
                  )
                    return;
                  try {
                    await api(`/ai/${scope}/drafts/${selected.id}`, {
                      method: "DELETE",
                    });
                    setSelected(null);
                    await load();
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                <Trash2 size={14} />
                {t("Xóa bản nháp", "Delete draft")}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
