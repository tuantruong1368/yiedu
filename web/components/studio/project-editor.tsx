"use client";
import { useState } from "react";
import { useI18n } from "../locale-provider";
import {
  defaultSlide,
  Presentation,
  ProjectData,
  ProjectKind,
  SimulationData,
  SimulationModel,
} from "@/lib/studio/types";
import { models } from "@/lib/studio/simulations";
import { studioTool } from "@/lib/studio/registry";
export default function ProjectEditor({
  kind,
  data,
  onChange,
  preview = false,
}: {
  kind: ProjectKind;
  data: ProjectData;
  onChange: (data: ProjectData) => void;
  preview?: boolean;
}) {
  const { t, locale } = useI18n(),
    [selected, setSelected] = useState(0),
    tool = studioTool(kind)!;
  if (preview) return <tool.Player data={data} />;
  if (kind === "simulation") {
    const d = data as SimulationData;
    return (
      <div className="project-editor simulation-editor">
        <aside className="studio-properties">
          <h3>{t("Mô hình", "Model")}</h3>
          <label>
            {t("Loại mô phỏng", "Simulation type")}
            <select
              value={d.model}
              onChange={(e) =>
                onChange({
                  version: "1.0",
                  model: e.target.value as SimulationModel,
                  parameters: {},
                })
              }
            >
              {Object.entries(models).map(([key, m]) => (
                <option key={key} value={key}>
                  {m[locale]}
                </option>
              ))}
            </select>
          </label>
          <p>
            {t(
              "Kéo thanh điều khiển để cấu hình trạng thái ban đầu. Học viên có thể thay đổi khi học.",
              "Use the controls to configure the initial state. Learners can experiment while studying.",
            )}
          </p>
        </aside>
        <div className="project-stage">
          <tool.Player data={d} onChange={onChange} />
        </div>
      </div>
    );
  }
  const d = data as Presentation,
    index = Math.min(selected, d.slides.length - 1),
    slide = d.slides[index];
  const update = (patch: any) =>
    onChange({
      ...d,
      slides: d.slides.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  const move = (offset: number) => {
    const to = index + offset;
    if (to < 0 || to >= d.slides.length) return;
    const slides = [...d.slides];
    [slides[index], slides[to]] = [slides[to], slides[index]];
    onChange({ ...d, slides });
    setSelected(to);
  };
  return (
    <div className="project-editor">
      <aside className="studio-scenes">
        <h3>
          {kind === "video"
            ? t("Các cảnh quay", "Scenes")
            : t("Các slide", "Slides")}
        </h3>
        {d.slides.map((s, i) => (
          <button
            type="button"
            className={i === index ? "selected" : ""}
            key={s.id}
            onClick={() => setSelected(i)}
          >
            <small>
              {String(i + 1).padStart(2, "0")} · {s.duration}s
            </small>
            <b>{s.title}</b>
          </button>
        ))}
        <button
          type="button"
          disabled={d.slides.length >= 80}
          onClick={() => {
            onChange({
              ...d,
              slides: [...d.slides, defaultSlide(t("Trang mới", "New slide"))],
            });
            setSelected(d.slides.length);
          }}
        >
          + {t("Thêm trang/cảnh", "Add slide/scene")}
        </button>
      </aside>
      <div className="project-stage">
        <div className="slide-stage" style={{ background: d.theme }}>
          <small>
            {kind.toUpperCase()} / {index + 1}
          </small>
          <h2>{slide.title}</h2>
          <p>{slide.body}</p>
          <span className="slide-number">
            {index + 1}/{d.slides.length}
          </span>
        </div>
        <div className="actions">
          <button type="button" disabled={!index} onClick={() => move(-1)}>
            ↑ {t("Di chuyển", "Move")}
          </button>
          <button
            type="button"
            disabled={index === d.slides.length - 1}
            onClick={() => move(1)}
          >
            ↓
          </button>
          <button
            type="button"
            disabled={d.slides.length >= 80}
            onClick={() => {
              const slides = [...d.slides];
              slides.splice(index + 1, 0, {
                ...slide,
                id: crypto.randomUUID(),
              });
              onChange({ ...d, slides });
              setSelected(index + 1);
            }}
          >
            {t("Nhân bản", "Duplicate")}
          </button>
          <button
            type="button"
            disabled={d.slides.length <= 1}
            onClick={() => {
              onChange({
                ...d,
                slides: d.slides.filter((_, i) => i !== index),
              });
              setSelected(Math.max(0, index - 1));
            }}
          >
            {t("Xóa", "Delete")}
          </button>
        </div>
        <p>
          {t(
            "Văn bản được giữ ở dạng chỉnh sửa được. Bản video có thể xuất file; bản slide có thể in PDF.",
            "Content stays editable. Export a video file or print the slide deck to PDF.",
          )}
        </p>
      </div>
      <aside className="studio-properties">
        <h3>{t("Thuộc tính", "Properties")}</h3>
        <label>
          {t("Tiêu đề trang/cảnh", "Slide/scene title")}
          <input
            maxLength={200}
            value={slide.title}
            onChange={(e) => update({ title: e.target.value })}
          />
        </label>
        <label>
          {t("Nội dung trang/cảnh", "Slide/scene content")}
          <textarea
            rows={8}
            maxLength={8000}
            value={slide.body}
            onChange={(e) => update({ body: e.target.value })}
          />
        </label>
        <label>
          {t("Lời giảng / ghi chú", "Narration / presenter notes")}
          <textarea
            rows={5}
            maxLength={8000}
            value={slide.notes}
            onChange={(e) => update({ notes: e.target.value })}
          />
        </label>
        <label>
          {t("Thời lượng (giây)", "Duration (seconds)")}
          <input
            type="number"
            min={1}
            max={300}
            value={slide.duration}
            onChange={(e) =>
              update({
                duration: Math.max(1, Math.min(300, +e.target.value || 1)),
              })
            }
          />
        </label>
        <label>
          {t("Màu chủ đạo", "Theme color")}
          <input
            type="color"
            value={d.theme}
            onChange={(e) => onChange({ ...d, theme: e.target.value })}
          />
        </label>
        {kind === "video" && (
          <label>
            {t(
              "Video HTTPS có sẵn (tùy chọn)",
              "Existing HTTPS video (optional)",
            )}
            <input
              type="url"
              value={d.source_url}
              onChange={(e) => onChange({ ...d, source_url: e.target.value })}
            />
          </label>
        )}
      </aside>
    </div>
  );
}
