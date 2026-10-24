"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { api, slugify } from "@/lib/api";
import {
  normalizeSite,
  baseCss,
  sanitizeImport,
  SiteDocument,
} from "@/lib/authoring/site";
import { installGadgets } from "@/lib/authoring/gadgets";
import { useI18n, LocaleSwitch } from "./locale-provider";
import { LogoMark } from "./tenant-brand";
import { ErrorBox, Loading } from "./shared";
export default function Builder({ id }: { id: string }) {
  const { t, locale } = useI18n();
  const [w, setW] = useState<any>(null),
    [site, setSite] = useState<SiteDocument | null>(null),
    [pageId, setPageId] = useState("home"),
    [editLocale, setEditLocale] = useState<"vi" | "en">(locale),
    [selected, setSelected] = useState<any>(null),
    [tick, force] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [zoom, setZoom] = useState(100),
    [importing, setImporting] = useState(false),
    [html, setHtml] = useState(""),
    [css, setCss] = useState(""),
    [panel, setPanel] = useState("gadgets"),
    [ready, setReady] = useState(false);
  const canvas = useRef<HTMLDivElement>(null),
    editor = useRef<Editor | null>(null),
    latest = useRef<SiteDocument | null>(null);
  latest.current = site;
  useEffect(() => {
    api("/workspaces/" + id)
      .then((x) => {
        setW(x);
        const d = normalizeSite(x);
        setSite(d);
        setPageId(d.pages[0].id);
      })
      .catch((e) => setError(e.message));
  }, [id]);
  function snapshot() {
    const d = structuredClone(latest.current!);
    const p = d.pages.find((x) => x.id === pageId);
    if (editor.current && p)
      p[editLocale] = {
        html: editor.current.getHtml(),
        css: editor.current.getCss() || "",
      };
    return d;
  }
  useEffect(() => {
    if (!w || !canvas.current) return;
    let disposed = false;
    let ed: Editor;
    import("grapesjs").then(async ({ default: grapesjs }) => {
      const vi = (await import("grapesjs/locale/vi.mjs")).default;
      if (disposed) return;
      ed = grapesjs.init({
        container: canvas.current!,
        i18n: {
          locale,
          detectLocale: false,
          localeFallback: "en",
          messages: { vi },
        },
        assetManager: { upload: false },
        height: "100%",
        storageManager: false,
        panels: { defaults: [] },
        blockManager: { appendTo: "#yd-gadgets" },
        traitManager: { appendTo: "#yd-traits" },
        styleManager: {
          appendTo: "#yd-styles",
          sectors: [
            {
              name: "Layout",
              open: true,
              properties: [
                "display",
                "position",
                "top",
                "left",
                "right",
                "bottom",
                "width",
                "height",
                "min-height",
                "max-width",
                "margin",
                "padding",
                "z-index",
              ],
            },
            {
              name: "Typography",
              properties: [
                "font-family",
                "font-size",
                "font-weight",
                "color",
                "text-align",
                "line-height",
              ],
            },
            {
              name: "Background & border",
              properties: [
                "background-color",
                "background-image",
                "background-size",
                "background-position",
                "border",
                "border-radius",
                "box-shadow",
                "opacity",
              ],
            },
          ],
        },
        layerManager: { appendTo: "#yd-layers" },
        canvas: { styles: [] },
        parser: {
          optionsHtml: { allowScripts: false, allowUnsafeAttr: false },
        },
        deviceManager: {
          devices: [
            { id: "desktop", name: "Desktop", width: "" },
            { id: "tablet", name: "Tablet", width: "768px" },
            { id: "mobile", name: "Mobile", width: "390px" },
          ],
        },
      });
      editor.current = ed;
      ed.I18n.setLocale(locale);
      installGadgets(ed, locale);
      ed.setDragMode("absolute");
      ed.on("component:selected", (c: any) => {
        setSelected(c);
        setPanel("properties");
        force((n) => n + 1);
      });
      ed.on("component:deselected", () => setSelected(null));
      ed.on("component:update", () => force((n) => n + 1));
      const d = latest.current!,
        p = d.pages.find((p) => p.id === pageId) || d.pages[0];
      ed.setComponents(p[editLocale].html);
      ed.setStyle(p[editLocale].css || baseCss);
      setReady(true);
    });
    return () => {
      disposed = true;
      ed?.destroy();
      editor.current = null;
      setReady(false);
    };
  }, [!!w]);
  useEffect(() => {
    if (editor.current) {
      editor.current.I18n.setLocale(locale);
      installGadgets(editor.current, locale);
    }
  }, [locale]);
  function changePage(nextId: string, nextLocale = editLocale) {
    if (!editor.current) return;
    const d = snapshot(),
      p = d.pages.find((x) => x.id === nextId)!;
    setSite(d);
    setPageId(nextId);
    setEditLocale(nextLocale);
    editor.current.setComponents(p[nextLocale].html);
    editor.current.setStyle(p[nextLocale].css || baseCss);
    setSelected(null);
    editor.current.UndoManager.clear();
  }
  async function save(publish = false) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = snapshot();
      const saved = await api("/workspaces/" + id, {
        method: "PUT",
        body: JSON.stringify({
          name: w.name,
          slug: w.slug,
          revision: w.revision,
          data: d,
        }),
      });
      setW(saved);
      setSite(saved.data);
      if (publish) {
        const result = await api("/workspaces/" + id + "/publish", {
          method: "POST",
        });
        setW(result.workspace);
        setNotice(t("Đã xuất bản website.", "Website published."));
      } else setNotice(t("Đã lưu bản nháp.", "Draft saved."));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function addPage() {
    const d = snapshot();
    const pid = crypto.randomUUID();
    const p = {
      id: pid,
      slug: "page-" + (d.pages.length + 1),
      title: { vi: "Trang mới", en: "New page" },
      vi: { html: "<section><h1>Trang mới</h1></section>", css: baseCss },
      en: { html: "<section><h1>New page</h1></section>", css: baseCss },
    };
    if (d.pages.length >= 20) {
      setError(t("Tối đa 20 trang.", "Maximum 20 pages."));
      return;
    }
    d.pages.push(p);
    d.menu.push({
      id: crypto.randomUUID(),
      page_id: pid,
      label: { ...p.title },
    });
    latest.current = d;
    setSite(d);
    changePage(pid);
  }
  if (!w || !site)
    return (
      <>
        <ErrorBox message={error} />
        <Loading />
      </>
    );
  const page = site.pages.find((p) => p.id === pageId)!,
    attrs = selected?.getAttributes() || {};
  function attribute(name: string, value: string) {
    selected?.addAttributes({ [name]: value });
    force(tick + 1);
  }
  return (
    <div className="studio-shell">
      <header className="studio-top">
        <Link href="/dashboard">
          ← {t("Không gian của tôi", "My workspace")}
        </Link>
        <input
          aria-label={t("Tên hệ thống", "Site name")}
          value={w.name}
          onChange={(e) => setW({ ...w, name: e.target.value })}
        />
        <span>
          {w.slug} · v{w.revision}
        </span>
        <LocaleSwitch />
        <button onClick={() => editor.current?.UndoManager.undo()}>↶</button>
        <button onClick={() => editor.current?.UndoManager.redo()}>↷</button>
        <button disabled={!ready || busy} onClick={() => save()}>
          {t("Lưu nháp", "Save draft")}
        </button>
        <button
          className="button small"
          disabled={!ready || busy}
          onClick={() => save(true)}
        >
          {t("Xuất bản", "Publish")}
        </button>
        {w.tenant_id && (
          <Link href={"/t/" + w.slug} target="_blank">
            ↗ {t("Xem trang", "Preview")}
          </Link>
        )}
      </header>
      <ErrorBox message={error} />
      {notice && (
        <div role="status" className="notice">
          {notice}
        </div>
      )}
      <div className="studio-toolbar">
        <select
          aria-label="Page"
          value={pageId}
          onChange={(e) => changePage(e.target.value)}
        >
          {site.pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title[editLocale] || p.slug || "Home"}
            </option>
          ))}
        </select>
        <button onClick={addPage}>+ {t("Thêm trang", "Add page")}</button>
        <select
          aria-label="Content language"
          value={editLocale}
          onChange={(e) => changePage(pageId, e.target.value as "vi" | "en")}
        >
          <option value="vi">Nội dung · Việt</option>
          <option value="en">Content · English</option>
        </select>
        <select
          aria-label="Device"
          onChange={(e) => editor.current?.setDevice(e.target.value)}
        >
          <option value="desktop">Desktop</option>
          <option value="tablet">Tablet</option>
          <option value="mobile">Mobile</option>
        </select>
        <button
          onClick={() => {
            const v = Math.max(25, zoom - 10);
            setZoom(v);
            editor.current?.Canvas.setZoom(v);
          }}
        >
          −
        </button>
        <span>{zoom}%</span>
        <button
          onClick={() => {
            const v = Math.min(200, zoom + 10);
            setZoom(v);
            editor.current?.Canvas.setZoom(v);
          }}
        >
          +
        </button>
        <button onClick={() => setImporting(!importing)}>
          {t("Nhập HTML/CSS", "Import HTML/CSS")}
        </button>
      </div>
      {importing && (
        <section className="studio-import">
          <p>
            {t(
              "Dán HTML và CSS của website anh có quyền sử dụng. Script sẽ bị loại bỏ; mã React/PHP cần xuất thành HTML trước.",
              "Paste HTML and CSS you are authorized to use. Scripts are removed; export React/PHP to HTML first.",
            )}
          </p>
          <textarea
            aria-label="HTML import"
            placeholder="HTML"
            value={html}
            onChange={(e) => setHtml(e.target.value)}
          />
          <textarea
            aria-label="CSS import"
            placeholder="CSS"
            value={css}
            onChange={(e) => setCss(e.target.value)}
          />
          <button
            onClick={() => {
              if (html.length > 150000 || css.length > 150000) {
                setError("HTML/CSS: max 150KB each");
                return;
              }
              const doc = new DOMParser().parseFromString(html, "text/html");
              const embedded = Array.from(doc.querySelectorAll("style"))
                .map((x) => x.textContent)
                .join("\n");
              editor.current?.setComponents(sanitizeImport(html));
              editor.current?.setStyle(baseCss + "\n" + embedded + "\n" + css);
              setImporting(false);
            }}
          >
            {t("Phân tích thành template", "Parse into template")}
          </button>
        </section>
      )}
      <div className="studio-body">
        <aside className="studio-inspector">
          <div className="studio-tabs">
            {[
              ["gadgets", t("Gadget", "Gadgets")],
              ["properties", t("Thuộc tính", "Properties")],
              ["pages", t("Trang/Menu/Logo", "Pages/Menu/Logo")],
              ["layers", t("Lớp", "Layers")],
            ].map(([key, label]) => (
              <button
                className={panel === key ? "active" : ""}
                key={key}
                onClick={() => setPanel(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            id="yd-gadgets"
            style={{ display: panel === "gadgets" ? "block" : "none" }}
          />
          <section
            style={{ display: panel === "properties" ? "block" : "none" }}
          >
            {selected ? (
              <>
                <div className="actions">
                  <button
                    onClick={() => selected.parent()?.append(selected.clone())}
                  >
                    {t("Nhân bản", "Duplicate")}
                  </button>
                  <button
                    onClick={() => {
                      selected.remove();
                      setSelected(null);
                    }}
                  >
                    {t("Xóa", "Delete")}
                  </button>
                  <button onClick={() => selected.append("<p>Text</p>")}>
                    + {t("Thêm con", "Add child")}
                  </button>
                </div>
                <label>
                  {t("Vị trí", "Position")}
                  <select
                    aria-label={t("Vị trí", "Position")}
                    value={selected.getStyle().position || "static"}
                    onChange={(e) => {
                      selected.addStyle({ position: e.target.value });
                      editor.current?.setDragMode(
                        e.target.value === "static" ? "" : "absolute",
                      );
                      force(tick + 1);
                    }}
                  >
                    <option value="static">Flow / Responsive</option>
                    <option value="absolute">Free / Absolute</option>
                    <option value="fixed">Fixed / Viewport</option>
                    <option value="relative">Relative</option>
                    <option value="sticky">Sticky</option>
                  </select>
                </label>
                <p>
                  {t(
                    "Kéo trên canvas để di chuyển; kéo các tay nắm để thay đổi kích thước.",
                    "Drag on the canvas to move; use handles to resize.",
                  )}
                </p>
                <fieldset>
                  <legend>{t("Sự kiện", "Events")}</legend>
                  <select
                    aria-label="Event"
                    value={attrs["data-event"] || ""}
                    onChange={(e) => attribute("data-event", e.target.value)}
                  >
                    <option value="">None</option>
                    {[
                      "click",
                      "dblclick",
                      "mouseenter",
                      "mouseleave",
                      "change",
                      "submit",
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <select
                    aria-label="Action"
                    value={attrs["data-action"] || "message"}
                    onChange={(e) => attribute("data-action", e.target.value)}
                  >
                    {["message", "navigate", "scroll", "toggle"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <input
                    aria-label="Event target"
                    placeholder="/page, https://… or element ID"
                    value={attrs["data-target"] || ""}
                    onChange={(e) => attribute("data-target", e.target.value)}
                  />
                  <input
                    aria-label="Event message"
                    placeholder={t("Thông báo", "Message")}
                    value={attrs["data-message"] || ""}
                    onChange={(e) => attribute("data-message", e.target.value)}
                  />
                  <h4>{t("Sự kiện bổ sung", "Additional events")}</h4>
                  {(() => {
                    let events: any[] = [];
                    try {
                      events = JSON.parse(attrs["data-events"] || "[]");
                    } catch {}
                    return (
                      <>
                        {events.map((event, i) => (
                          <div className="studio-event-row" key={i}>
                            <select
                              aria-label={"Additional event " + i}
                              value={event.event}
                              onChange={(e) => {
                                events[i] = { ...event, event: e.target.value };
                                attribute(
                                  "data-events",
                                  JSON.stringify(events),
                                );
                              }}
                            >
                              {[
                                "click",
                                "dblclick",
                                "mouseenter",
                                "mouseleave",
                                "change",
                                "submit",
                              ].map((x) => (
                                <option key={x}>{x}</option>
                              ))}
                            </select>
                            <select
                              aria-label={"Additional action " + i}
                              value={event.action}
                              onChange={(e) => {
                                events[i] = {
                                  ...event,
                                  action: e.target.value,
                                };
                                attribute(
                                  "data-events",
                                  JSON.stringify(events),
                                );
                              }}
                            >
                              {["message", "navigate", "scroll", "toggle"].map(
                                (x) => (
                                  <option key={x}>{x}</option>
                                ),
                              )}
                            </select>
                            <input
                              placeholder="Target"
                              value={event.target || ""}
                              onChange={(e) => {
                                events[i] = {
                                  ...event,
                                  target: e.target.value,
                                };
                                attribute(
                                  "data-events",
                                  JSON.stringify(events),
                                );
                              }}
                            />
                            <input
                              placeholder="Message"
                              value={event.message || ""}
                              onChange={(e) => {
                                events[i] = {
                                  ...event,
                                  message: e.target.value,
                                };
                                attribute(
                                  "data-events",
                                  JSON.stringify(events),
                                );
                              }}
                            />
                            <button
                              onClick={() =>
                                attribute(
                                  "data-events",
                                  JSON.stringify(
                                    events.filter((_, j) => j !== i),
                                  ),
                                )
                              }
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          disabled={events.length >= 8}
                          onClick={() =>
                            attribute(
                              "data-events",
                              JSON.stringify([
                                ...events,
                                {
                                  event: "click",
                                  action: "message",
                                  message: "Hello",
                                },
                              ]),
                            )
                          }
                        >
                          + {t("Thêm sự kiện", "Add event")}
                        </button>
                      </>
                    );
                  })()}
                </fieldset>
              </>
            ) : (
              <p>
                {t(
                  "Chọn một gadget trên trang.",
                  "Select a gadget on the page.",
                )}
              </p>
            )}
            <div id="yd-traits" />
            <div id="yd-styles" />
          </section>
          <div
            id="yd-layers"
            style={{ display: panel === "layers" ? "block" : "none" }}
          />
          {panel === "pages" && (
            <section>
              <label>
                {t("Địa chỉ hệ thống", "Site slug")}
                <input
                  disabled={!!w.tenant_id}
                  value={w.slug}
                  onChange={(e) =>
                    setW({ ...w, slug: slugify(e.target.value) })
                  }
                />
              </label>
              <h3>{t("Trang hiện tại", "Current page")}</h3>
              <label>
                {t("Tiêu đề trang", "Page title")}
                <input
                  value={page.title[editLocale]}
                  onChange={(e) =>
                    setSite({
                      ...snapshot(),
                      pages: snapshot().pages.map((p) =>
                        p.id === pageId
                          ? {
                              ...p,
                              title: {
                                ...p.title,
                                [editLocale]: e.target.value,
                              },
                            }
                          : p,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Slug
                <input
                  disabled={page.slug === ""}
                  value={page.slug}
                  onChange={(e) =>
                    setSite({
                      ...snapshot(),
                      pages: snapshot().pages.map((p) =>
                        p.id === pageId
                          ? { ...p, slug: slugify(e.target.value) }
                          : p,
                      ),
                    })
                  }
                />
              </label>
              {page.slug !== "" && (
                <button
                  onClick={() => {
                    const d = snapshot();
                    d.pages = d.pages.filter((p) => p.id !== pageId);
                    d.menu = d.menu.filter((m) => m.page_id !== pageId);
                    latest.current = d;
                    setSite(d);
                    changePage(d.pages.find((p) => p.slug === "")!.id);
                  }}
                >
                  {t("Xóa trang", "Delete page")}
                </button>
              )}
              <h3>Menu</h3>
              {site.menu.map((m, i) => (
                <div key={m.id} className="studio-menu-row">
                  <input
                    aria-label={"Menu " + i}
                    value={m.label[editLocale]}
                    onChange={(e) =>
                      setSite({
                        ...snapshot(),
                        menu: snapshot().menu.map((x) =>
                          x.id === m.id
                            ? {
                                ...x,
                                label: {
                                  ...x.label,
                                  [editLocale]: e.target.value,
                                },
                              }
                            : x,
                        ),
                      })
                    }
                  />
                  <select
                    value={m.page_id}
                    onChange={(e) =>
                      setSite({
                        ...snapshot(),
                        menu: snapshot().menu.map((x) =>
                          x.id === m.id ? { ...x, page_id: e.target.value } : x,
                        ),
                      })
                    }
                  >
                    {site.pages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title[editLocale]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const d = snapshot();
                      [d.menu[i - 1], d.menu[i]] = [d.menu[i], d.menu[i - 1]];
                      setSite(d);
                    }}
                    disabled={i === 0}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() =>
                      setSite({
                        ...snapshot(),
                        menu: snapshot().menu.filter((x) => x.id !== m.id),
                      })
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const d = snapshot();
                  d.menu.push({
                    id: crypto.randomUUID(),
                    page_id: pageId,
                    label: { ...page.title },
                  });
                  setSite(d);
                }}
              >
                + Menu
              </button>
              <h3>{t("Nhận diện thương hiệu", "Brand identity")}</h3>
              <LogoMark branding={site.branding} name={w.name} />
              <label>
                {t("Chữ thương hiệu / tạo logo", "Brand text / generate logo")}
                <input
                  value={site.branding.text}
                  onChange={(e) =>
                    setSite({
                      ...snapshot(),
                      branding: { ...site.branding, text: e.target.value },
                    })
                  }
                />
              </label>
              <label>
                {t("Màu logo", "Logo color")}
                <input
                  type="color"
                  value={site.branding.color}
                  onChange={(e) =>
                    setSite({
                      ...snapshot(),
                      branding: { ...site.branding, color: e.target.value },
                    })
                  }
                />
              </label>
              <select
                value={site.branding.variant}
                onChange={(e) =>
                  setSite({
                    ...snapshot(),
                    branding: {
                      ...site.branding,
                      variant: e.target.value as any,
                    },
                  })
                }
              >
                <option>rounded</option>
                <option>circle</option>
                <option>square</option>
              </select>
              <input
                aria-label="Logo URL"
                placeholder="https://… logo.png"
                value={
                  site.branding.logo_url.startsWith("data:")
                    ? ""
                    : site.branding.logo_url
                }
                onChange={(e) =>
                  setSite({
                    ...snapshot(),
                    branding: { ...site.branding, logo_url: e.target.value },
                  })
                }
              />
              <label>
                {t(
                  "Tải logo PNG/JPEG/WebP (200KB)",
                  "Upload PNG/JPEG/WebP logo (200KB)",
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 200000) {
                      setError("Logo: max 200KB");
                      return;
                    }
                    const r = new FileReader();
                    r.onload = () =>
                      setSite({
                        ...snapshot(),
                        branding: {
                          ...latest.current!.branding,
                          logo_url: String(r.result),
                        },
                      });
                    r.readAsDataURL(f);
                  }}
                />
              </label>
              <button
                onClick={() =>
                  setSite({
                    ...snapshot(),
                    branding: { ...site.branding, logo_url: "" },
                  })
                }
              >
                {t("Dùng logo chữ tự tạo", "Use generated text logo")}
              </button>
              <label>
                {t("Ngôn ngữ mặc định", "Default language")}
                <select
                  value={site.default_locale}
                  onChange={(e) =>
                    setSite({
                      ...snapshot(),
                      default_locale: e.target.value as "vi" | "en",
                    })
                  }
                >
                  <option value="vi">Việt</option>
                  <option value="en">English</option>
                </select>
              </label>
            </section>
          )}
        </aside>
        <main className="studio-canvas" ref={canvas} />
      </div>
    </div>
  );
}
