"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor } from "grapesjs";
import { Plus, Search, Star, GripVertical } from "lucide-react";
import { gadgetCatalog } from "@/lib/authoring/gadgets";
import { useI18n } from "../locale-provider";
import GadgetPreview from "./gadget-preview";
const groups = [
  ["all", "Tất cả", "All"],
  ["sections", "Bố cục mẫu", "Sections"],
  ["layout", "Bố cục", "Layout"],
  ["content", "Nội dung", "Content"],
  ["media", "Media", "Media"],
  ["interactive", "Tương tác", "Interactive"],
  ["favorites", "Đã lưu", "Saved"],
];
export default function GadgetLibrary({
  editor,
  onInsert,
}: {
  editor: Editor | null;
  onInsert: (id: string) => void;
}) {
  const { t, locale } = useI18n(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    try {
      const value = JSON.parse(
        localStorage.getItem("website-gadget-favorites") || "[]",
      );
      if (Array.isArray(value))
        setFavorites(value.filter((x) => typeof x === "string"));
    } catch {}
  }, []);
  const dragCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => dragCleanup.current?.(), []);
  function beginDrag(
    event: React.PointerEvent<HTMLDivElement>,
    packageId: string,
    label: string,
  ) {
    if (
      !editor ||
      event.button !== 0 ||
      (event.target as Element).closest("button")
    )
      return;
    event.preventDefault();
    dragCleanup.current?.();
    const origin = { x: event.clientX, y: event.clientY },
      overlay = document.createElement("div"),
      ghost = document.createElement("div");
    overlay.className = "website-drag-overlay";
    ghost.className = "website-drag-ghost";
    ghost.textContent = label;
    overlay.appendChild(ghost);
    document.body.appendChild(overlay);
    let moved = false,
      target: Element | null = null,
      outlined: HTMLElement | null = null,
      oldOutline = "";
    const clearOutline = () => {
      if (outlined) outlined.style.outline = oldOutline;
      outlined = null;
    };
    const locate = (e: PointerEvent) => {
      const frame = editor!.Canvas.getFrameEl(),
        rect = frame.getBoundingClientRect(),
        area = editor!.Canvas.getElement().getBoundingClientRect();
      const inside =
        e.clientX >= Math.max(rect.left, area.left) &&
        e.clientX <= Math.min(rect.right, area.right) &&
        e.clientY >= Math.max(rect.top, area.top) &&
        e.clientY <= Math.min(rect.bottom, area.bottom);
      if (!inside) return null;
      return (
        editor!.Canvas.getDocument()?.elementFromPoint(
          ((e.clientX - rect.left) * frame.clientWidth) / rect.width,
          ((e.clientY - rect.top) * frame.clientHeight) / rect.height,
        ) || null
      );
    };
    const move = (e: PointerEvent) => {
      moved =
        moved || Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 6;
      ghost.style.transform = `translate(${e.clientX + 16}px,${e.clientY + 14}px)`;
      target = locate(e);
      ghost.classList.toggle("valid", !!target);
      clearOutline();
      if (target) {
        outlined = (target.closest(
          '[data-gjs-type="wrapper"],section,article,div',
        ) || target) as HTMLElement;
        oldOutline = outlined.style.outline;
        outlined.style.outline = "2px dashed #328b70";
      }
    };
    const cleanup = () => {
      clearOutline();
      overlay.remove();
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", cleanup, true);
      window.removeEventListener("blur", cleanup);
      window.removeEventListener("keydown", escape);
      dragCleanup.current = null;
    };
    const up = (e: PointerEvent) => {
      target = locate(e);
      const node = target;
      cleanup();
      if (!moved || !node) return;
      let element: Element | null = node,
        model: any = null;
      const wrapper = editor!.getWrapper();
      while (element && !model) {
        if (element.id) {
          if (wrapper?.getId() === element.id) model = wrapper;
          else model = wrapper?.find(`#${CSS.escape(element.id)}`)[0];
        }
        element = element.parentElement;
      }
      editor!.select(model || wrapper);
      onInsert(packageId);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cleanup();
    };
    dragCleanup.current = cleanup;
    window.addEventListener("pointermove", move, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", cleanup, true);
    window.addEventListener("blur", cleanup);
    window.addEventListener("keydown", escape);
    ghost.style.transform = `translate(${event.clientX + 16}px,${event.clientY + 14}px)`;
  }
  const catalog = gadgetCatalog(),
    filtered = catalog.filter(
      (g) =>
        (category === "all" ||
          (category === "favorites"
            ? favorites.includes(g.packageId)
            : g.category === category)) &&
        `${g.label.vi} ${g.label.en} ${g.packageId}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  return (
    <div className="gadget-library">
      <header>
        <h2>{t("Thư viện thiết kế", "Design library")}</h2>
        <p>
          {t(
            "Kéo vào canvas hoặc nhấn + để thêm.",
            "Drag onto the canvas or click + to insert.",
          )}
        </p>
      </header>
      <label className="builder-search">
        <Search size={15} />
        <input
          type="search"
          aria-label={t("Tìm gadget", "Search gadgets")}
          placeholder={t(
            "Tìm khối, hình ảnh, nút…",
            "Search blocks, images, buttons…",
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div
        className="gadget-filter"
        role="group"
        aria-label={t("Nhóm gadget", "Gadget categories")}
      >
        {groups.map(([key, vi, en]) => (
          <button
            type="button"
            aria-pressed={category === key}
            className={category === key ? "active" : ""}
            key={key}
            onClick={() => setCategory(key)}
          >
            {t(vi, en)}
          </button>
        ))}
      </div>
      <div className="gadget-library-grid">
        {filtered.map((g) => (
          <article className="gadget-tile" key={g.packageId}>
            <div
              className="gadget-drag-preview"
              onPointerDown={(e) => beginDrag(e, g.packageId, g.label[locale])}
              onDragStart={(e) => e.preventDefault()}
              onDoubleClick={() => onInsert(g.packageId)}
            >
              <GadgetPreview kind={g.packageId.split(".")[1]} />
              <span className="gadget-grip">
                <GripVertical size={12} />
              </span>
              <button
                type="button"
                className={`gadget-favorite ${favorites.includes(g.packageId) ? "active" : ""}`}
                aria-label={`${t("Lưu gadget", "Save gadget")} ${g.label[locale]}`}
                aria-pressed={favorites.includes(g.packageId)}
                onClick={() =>
                  setFavorites((a) => {
                    const next = a.includes(g.packageId)
                      ? a.filter((x) => x !== g.packageId)
                      : [...a, g.packageId];
                    try {
                      localStorage.setItem(
                        "website-gadget-favorites",
                        JSON.stringify(next),
                      );
                    } catch {}
                    return next;
                  })
                }
              >
                <Star size={13} />
              </button>
            </div>
            <div className="gadget-tile-caption">
              <span title={g.label[locale]}>{g.label[locale]}</span>
              <button
                type="button"
                aria-label={`${t("Thêm", "Add")} ${g.label[locale]}`}
                disabled={!editor}
                onClick={() => onInsert(g.packageId)}
              >
                <Plus size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="builder-empty-note">
          {t("Không tìm thấy gadget phù hợp.", "No matching gadgets.")}
        </p>
      )}
      <footer>
        {catalog.length}{" "}
        {t(
          "gadget có thể mở rộng qua SDK",
          "gadgets, extensible through the SDK",
        )}
      </footer>
    </div>
  );
}
