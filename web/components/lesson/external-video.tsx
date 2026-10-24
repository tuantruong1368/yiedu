"use client";
import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import { useI18n } from "../locale-provider";
export function youtubeID(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const id =
      url.hostname === "youtu.be"
        ? url.pathname.slice(1)
        : [
              "youtube.com",
              "www.youtube.com",
              "www.youtube-nocookie.com",
            ].includes(url.hostname)
          ? url.pathname.startsWith("/embed/")
            ? url.pathname.split("/")[2]
            : url.searchParams.get("v")
          : null;
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export default function ExternalVideo({
  url,
  title = "",
}: {
  url: string;
  title?: string;
}) {
  const { t } = useI18n();
  const [playing, setPlaying] = useState(false),
    [failed, setFailed] = useState(false);
  const id = youtubeID(url),
    label = title || t("Video bài học", "Lesson video");
  return (
    <figure className="external-video">
      <div className="external-video-stage">
        {id ? (
          playing ? (
            <iframe
              key={id}
              title={label}
              src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="external-video-play"
              onClick={() => setPlaying(true)}
              aria-label={`${t("Phát video", "Play video")}: ${label}`}
            >
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <span className="external-video-play-icon">
                <Play size={25} fill="currentColor" />
              </span>
              <strong>{label}</strong>
              <small>
                {t(
                  "Bấm để tải trình phát YouTube",
                  "Select to load the YouTube player",
                )}
              </small>
            </button>
          )
        ) : (
          <video
            controls
            preload="metadata"
            src={url}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption>
        <span>
          {id ? "YouTube" : t("Video bài học", "Lesson video")} · {label}
        </span>
        <a href={url} target="_blank" rel="noopener noreferrer">
          {t("Mở video nguồn", "Open original video")}
          <ExternalLink size={13} />
        </a>
      </figcaption>
      {failed && (
        <p role="status">
          {t(
            "Chưa phát được tại đây. Hãy thử liên kết video nguồn.",
            "Playback is unavailable here. Try the original video link.",
          )}
        </p>
      )}
    </figure>
  );
}
