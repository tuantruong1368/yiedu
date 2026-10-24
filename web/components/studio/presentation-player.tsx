"use client";
import { useEffect, useState } from "react";
import { useI18n } from "../locale-provider";
import type { Presentation } from "@/lib/studio/types";
export default function PresentationPlayer({
  data,
  video = false,
}: {
  data: Presentation;
  video?: boolean;
}) {
  const { t, locale } = useI18n(),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [notes, setNotes] = useState(false),
    [narrate, setNarrate] = useState(false);
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [data]);
  const slide = data.slides[Math.min(index, data.slides.length - 1)];
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (index >= data.slides.length - 1) setPlaying(false);
      else setIndex((i) => i + 1);
    }, slide.duration * 1000);
    return () => clearTimeout(timer);
  }, [playing, index, slide.duration, data.slides.length]);
  useEffect(() => {
    if (!playing || !narrate || !window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(
      slide.notes || `${slide.title}. ${slide.body}`,
    );
    utter.lang = locale === "vi" ? "vi-VN" : "en-US";
    window.speechSynthesis.speak(utter);
    return () => window.speechSynthesis.cancel();
  }, [playing, narrate, index, locale, slide]);
  if (video && data.source_url) {
    const youtube = data.source_url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/,
    );
    return (
      <div className="studio-video">
        {youtube ? (
          <iframe
            title={t("Video bài giảng", "Lesson video")}
            src={`https://www.youtube-nocookie.com/embed/${youtube[1]}`}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video controls preload="metadata" src={data.source_url} />
        )}
      </div>
    );
  }
  return (
    <section
      className="presentation-player"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight")
          setIndex((i) => Math.min(i + 1, data.slides.length - 1));
        if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      }}
      aria-label={
        video
          ? t("Video bài giảng theo cảnh", "Scene-based lesson video")
          : t("Slide bài giảng", "Lesson slides")
      }
    >
      <div className="slide-stage" style={{ background: data.theme }}>
        <small>
          {video
            ? t("VIDEO BÀI GIẢNG · THEO CẢNH", "LESSON VIDEO · SCENE PLAYER")
            : "LEARNING STUDIO"}{" "}
          / {index + 1}
        </small>
        <h2>{slide.title}</h2>
        <p>{slide.body}</p>
        <span className="slide-number">
          {index + 1} / {data.slides.length}
        </span>
      </div>
      <div className="player-controls">
        <button
          type="button"
          aria-label={t("Trang trước", "Previous slide")}
          disabled={!index}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => i - 1);
          }}
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => {
            if (!playing && index === data.slides.length - 1) setIndex(0);
            setPlaying(!playing);
          }}
        >
          {playing ? t("Tạm dừng", "Pause") : t("Phát", "Play")}
        </button>
        <button
          type="button"
          aria-label={t("Trang tiếp", "Next slide")}
          disabled={index === data.slides.length - 1}
          onClick={() => {
            setPlaying(false);
            setIndex((i) => i + 1);
          }}
        >
          →
        </button>
        <span>
          {index + 1}/{data.slides.length} · {slide.duration}s
        </span>
        <button type="button" onClick={() => setNotes(!notes)}>
          {t("Ghi chú", "Notes")}
        </button>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={narrate}
            onChange={(e) => setNarrate(e.target.checked)}
          />
          {t("Đọc lời giảng", "Read narration")}
        </label>
      </div>
      {notes && (
        <p className="presenter-notes">
          {slide.notes || t("Chưa có ghi chú.", "No presenter notes.")}
        </p>
      )}
    </section>
  );
}
