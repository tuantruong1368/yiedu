"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "./locale-provider";
export default function TemplateThumbnail({
  id,
  name,
  hero = false,
}: {
  id: string;
  name: string;
  hero?: boolean;
}) {
  const { locale, t } = useI18n();
  const viewport = useRef<HTMLDivElement>(null),
    [scale, setScale] = useState(0.3);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setScale(entries[0].contentRect.width / 1280),
    );
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className={`template-website-shot ${hero ? "hero-website-shot" : ""}`}>
      <div className="shot-browser">
        <span>● ● ●</span>
        <span>{name.toLowerCase().replace(/[^a-z0-9]/g, "")}.yiedu.vn</span>
      </div>
      <div className="shot-viewport" ref={viewport}>
        <iframe
          style={{ transform: `scale(${scale})` }}
          title={`${t("Website mẫu", "Template website")} ${name}`}
          src={`/templates/${id}/thumbnail?locale=${locale}`}
          loading={hero ? "eager" : "lazy"}
          sandbox=""
          tabIndex={-1}
        />
      </div>
      <span className="shot-caption">
        {t(
          "Giao diện website được tạo từ mẫu",
          "Actual template website layout",
        )}
      </span>
    </div>
  );
}
