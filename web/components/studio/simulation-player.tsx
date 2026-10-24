"use client";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "../locale-provider";
import {
  drive,
  models,
  parameters,
  pid,
  sortFrames,
} from "@/lib/studio/simulations";
import type { SimulationData } from "@/lib/studio/types";
export default function SimulationPlayer({
  data,
  onChange,
}: {
  data: SimulationData;
  onChange?: (data: SimulationData) => void;
}) {
  const { t, locale } = useI18n(),
    [values, setValues] = useState(parameters(data)),
    [step, setStep] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    setValues(parameters(data));
    setStep(0);
    setPlaying(false);
  }, [data]);
  const frames = useMemo(
    () => sortFrames(Math.round(values.size || 10)),
    [values.size],
  );
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setStep((s) => {
          if (s >= frames.length - 1) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      500 / (values.speed || 4),
    );
    return () => clearInterval(timer);
  }, [playing, frames.length, values.speed]);
  const update = (key: string, value: number) => {
    const p = { ...values, [key]: value };
    setValues(p);
    setStep(0);
    onChange?.({ ...data, parameters: p });
  };
  let chart,
    stats = "";
  if (data.model === "differential-drive") {
    const r = drive(values),
      extent = Math.max(1, ...r.points.flatMap((p) => p.map(Math.abs))),
      scale = 105 / extent;
    chart = (
      <svg viewBox="0 0 600 280" aria-label="Robot trajectory">
        <path d="M30 140H570M300 15V265" stroke="#cbd5d1" />
        <polyline
          points={r.points
            .map(([x, y]) => `${300 + x * scale},${140 - y * scale}`)
            .join(" ")}
          stroke="#2563eb"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx={300 + r.x * scale}
          cy={140 - r.y * scale}
          r="7"
          fill="#dc5a35"
        />
        <text x="20" y="270">
          10 s · {t("Mỗi ô", "Extent")} ±{extent.toFixed(1)} m
        </text>
      </svg>
    );
    stats = `v=${r.v.toFixed(2)} m/s · ω=${r.w.toFixed(2)} rad/s · x=${r.x.toFixed(2)} m · y=${r.y.toFixed(2)} m`;
  } else if (data.model === "pid") {
    const r = pid(values),
      scale = 210 / Math.max(values.target, r.peak, 0.1);
    chart = (
      <svg viewBox="0 0 600 280" aria-label="PID response">
        <path
          d={`M20 ${250 - values.target * scale}H580`}
          stroke="#dc5a35"
          strokeDasharray="5 5"
        />
        <polyline
          points={r.points
            .map(([x, y]) => `${20 + x * 70},${250 - y * scale}`)
            .join(" ")}
          stroke="#2563eb"
          strokeWidth="3"
          fill="none"
        />
        <text x="20" y="275">
          0 → 8 s · {t("Đường đứt: giá trị đặt", "Dashed line: setpoint")}
        </text>
      </svg>
    );
    stats = `${t("Sai số cuối", "Final error")}=${r.error.toFixed(3)} · ${t("Đỉnh", "Peak")}=${r.peak.toFixed(3)}`;
  } else if (data.model === "sorting") {
    const f = frames[Math.min(step, frames.length - 1)];
    chart = (
      <div
        className="sorting-chart"
        role="img"
        aria-label="Sorting visualization"
      >
        {f.values.map((v, i) => (
          <div
            key={i}
            style={{
              height: `${(v / (values.size || 10)) * 90}%`,
              background: f.pair.includes(i) ? "#dc5a35" : "#2563eb",
            }}
          >
            <span>{v}</span>
          </div>
        ))}
      </div>
    );
    stats = `${t("So sánh", "Comparisons")}: ${f.comparisons}/${frames.length - 1}`;
  } else {
    const p = values.parallel,
      speedup = 1 / (1 - p + p / values.workers);
    chart = (
      <svg viewBox="0 0 600 280" aria-label="Amdahl scaling">
        <path d="M30 20V250H580" stroke="#bbb" />
        <polyline
          points={Array.from(
            { length: 64 },
            (_, i) =>
              `${30 + i * 8.5},${250 - (1 / (1 - p + p / (i + 1))) * 3.4}`,
          ).join(" ")}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
        />
        <circle
          cx={30 + (values.workers - 1) * 8.5}
          cy={250 - speedup * 3.4}
          r="7"
          fill="#dc5a35"
        />
        <text x="35" y="275">
          1 → 64 workers · 0 → 64×
        </text>
      </svg>
    );
    stats = `S=${speedup.toFixed(2)}× · ${t("Giới hạn", "Limit")}: ${(1 / (1 - p)).toFixed(2)}×`;
  }
  return (
    <section className="studio-simulation">
      <h3>{models[data.model][locale]}</h3>
      <p>{models[data.model].description[locale === "vi" ? 0 : 1]}</p>
      <div className="simulation-chart">{chart}</div>
      <output>{stats}</output>
      <div className="simulation-controls">
        {Object.entries(models[data.model].controls).map(([key, c]) => (
          <label key={key}>
            {c[locale === "vi" ? 0 : 1]} <b>{values[key]}</b>
            <input
              aria-label={c[locale === "vi" ? 0 : 1]}
              type="range"
              min={c[2]}
              max={c[3]}
              step={c[4]}
              value={values[key]}
              onChange={(e) => update(key, +e.target.value)}
            />
          </label>
        ))}
      </div>
      {data.model === "sorting" && (
        <div className="actions">
          <button type="button" onClick={() => setPlaying(!playing)}>
            {playing ? t("Tạm dừng", "Pause") : t("Chạy", "Play")}
          </button>
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, frames.length - 1))}
          >
            {t("Từng bước", "Step")}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep(0);
              setPlaying(false);
            }}
          >
            {t("Đặt lại", "Reset")}
          </button>
        </div>
      )}
    </section>
  );
}
