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
import { gadgetCatalog, installGadgets } from "@/lib/authoring/gadgets";
import { useI18n, LocaleSwitch } from "./locale-provider";
import {
  Eye,
  Maximize2,
  Minimize2,
  Monitor,
  Undo2,
  Redo2,
  Save,
  Send,
  SlidersHorizontal,
  X,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import GadgetLibrary from "./authoring/gadget-library";
import SiteRuntime from "./authoring/site-runtime";
import { LogoMark } from "./tenant-brand";
import { ErrorBox, Loading } from "./shared";
function withBaseStyles(css: string) {
  return css.includes(".yd-feature-grid") ? css : baseCss + "\n" + css;
}
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
    [ready, setReady] = useState(false),
    [dirty, setDirty] = useState(false),
    [focusMode, setFocusMode] = useState(false),
    [device, setDevice] = useState("desktop"),
    [previewSite, setPreviewSite] = useState<SiteDocument | null>(null),
    [previewPage, setPreviewPage] = useState("home"),
    [previewCourses, setPreviewCourses] = useState<any[]>([]),
    [recovery, setRecovery] = useState<any>(null);
  const canvas = useRef<HTMLDivElement>(null),
    editor = useRef<Editor | null>(null),
    latest = useRef<SiteDocument | null>(null);
  const commandRef = useRef<() => void>(() => {}),
    snapshotRef = useRef<() => SiteDocument>(() => latest.current!),
    loadingCanvas = useRef(true);
  latest.current = site;
  snapshotRef.current = snapshot;
  commandRef.current = () => {
    if (ready && !busy) save();
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        commandRef.current();
      }
      if (e.key === "Escape") setPreviewSite(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const guard = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  useEffect(() => {
    if (!w || !dirty || !ready || busy) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(
          `website-draft:${w.owner_id}:${id}`,
          JSON.stringify({
            data: snapshotRef.current(),
            revision: w.revision,
            name: w.name,
            slug: w.slug,
          }),
        );
      } catch {}
    }, 700);
    return () => clearTimeout(timer);
  }, [tick, site, w?.name, w?.slug, dirty, ready, busy]);
  useEffect(() => {
    api("/workspaces/" + id)
      .then((x) => {
        setW(x);
        const d = normalizeSite(x);
        setSite(d);
        setPageId(d.pages[0].id);
        try {
          const draft = localStorage.getItem(
            `website-draft:${x.owner_id}:${id}`,
          );
          if (draft) setRecovery(JSON.parse(draft));
        } catch {}
        api(`/catalog/templates/${x.template_id}`)
          .then((preview) => setPreviewCourses(preview.courses || []))
          .catch(() => {});
        if (x.tenant_id)
          api(`/sites/${x.slug}`)
            .then((preview) => setPreviewCourses(preview.courses || []))
            .catch(() => {});
      })
      .catch((e) => setError(e.message));
  }, [id]);
  function snapshot() {
    const d = structuredClone(latest.current!);
    const p = d.pages.find((x) => x.id === pageId);
    if (editor.current && p)
      p[editLocale] = {
        html: editor.current.getHtml(),
        css: editor.current.getCss({ keepUnusedStyles: true }) || "",
      };
    return d;
  }
  useEffect(() => {
    if (!w || !canvas.current) return;
    let disposed = false;
    let ed: Editor;
    import("grapesjs").then(async ({ default: grapesjs }) => {
      const vi = (await import("grapesjs/locale/vi.mjs")).default;
      const postcssParser = (await import("grapesjs-parser-postcss")).default;
      if (disposed) return;
      ed = grapesjs.init({
        container: canvas.current!,
        plugins: [postcssParser],
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
        blockManager: { appendTo: "#yd-gadgets", custom: true },
        keepUnusedStyles: true,
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
            { id: "desktop", name: "Desktop", width: "1280px" },
            { id: "tablet", name: "Tablet", width: "768px" },
            { id: "mobile", name: "Mobile", width: "390px" },
          ],
        },
      });
      editor.current = ed;
      ed.I18n.setLocale(locale);
      installGadgets(ed, locale);
      ed.setDragMode("");
      ed.on("component:selected", (c: any) => {
        setSelected(c);

        force((n) => n + 1);
      });
      ed.on("component:deselected", () => setSelected(null));
      ed.on("component:update", () => force((n) => n + 1));
      ed.on("update", () => {
        if (!loadingCanvas.current) {
          setDirty(true);
          force((n) => n + 1);
        }
      });
      const d = latest.current!,
        p = d.pages.find((p) => p.id === pageId) || d.pages[0];
      ed.setComponents(p[editLocale].html);
      ed.setStyle(withBaseStyles(p[editLocale].css || ""));
      setReady(true);
      ed.on("load", () => {
        ed.Canvas.fitViewport({ ignoreHeight: true, gap: 24 });
        setZoom(Math.round(ed.Canvas.getZoom()));
      });
      setTimeout(() => {
        loadingCanvas.current = false;
      }, 100);
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
  useEffect(() => {
    if (!ready || !canvas.current || !editor.current) return;
    const fitHeight = () => {
      const ed = editor.current;
      if (!ed || !canvas.current) return;
      const height = `${Math.ceil(canvas.current.clientHeight / (ed.Canvas.getZoom() / 100))}px`;
      const frame = ed.Canvas.getFrame();
      if (frame.get("height") !== height) frame.set("height", height);
    };
    const observer = new ResizeObserver(fitHeight);
    observer.observe(canvas.current);
    fitHeight();
    return () => observer.disconnect();
  }, [ready, zoom, focusMode, device]);
  function changePage(nextId: string, nextLocale = editLocale) {
    if (!editor.current) return;
    const d = snapshot(),
      p = d.pages.find((x) => x.id === nextId)!;
    setSite(d);
    setPageId(nextId);
    setEditLocale(nextLocale);
    loadingCanvas.current = true;
    editor.current.setComponents(p[nextLocale].html);
    editor.current.setStyle(withBaseStyles(p[nextLocale].css || ""));
    setTimeout(() => {
      loadingCanvas.current = false;
    }, 100);
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
      setDirty(false);
      localStorage.removeItem(`website-draft:${w.owner_id}:${id}`);
      setRecovery(null);
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
  function insertGadget(packageId: string) {
    const ed = editor.current,
      block = ed?.Blocks.get(packageId);
    if (!ed || !block) return;
    const content = block.get("content"),
      target = ed.getSelected();
    if (typeof content !== "string") return;
    let added: any;
    if (
      target &&
      target !== ed.getWrapper() &&
      gadgetCatalog().find((g) => g.packageId === packageId)?.category !==
        "sections"
    ) {
      const tag = String(target.get("tagName") || ""),
        parent = target.parent();
      if (
        ["section", "div", "article", "main", "header", "footer"].includes(
          tag,
        ) &&
        target.get("droppable")
      )
        added = target.append(content)[0];
      else if (parent)
        added = parent.append(content, {
          at: parent.components().indexOf(target) + 1,
        })[0];
    }
    if (
      !added &&
      target &&
      target !== ed.getWrapper() &&
      gadgetCatalog().find((g) => g.packageId === packageId)?.category ===
        "sections"
    ) {
      let sibling = target;
      while (sibling.parent() && sibling.parent() !== ed.getWrapper())
        sibling = sibling.parent()!;
      const root = ed.getWrapper();
      if (root)
        added = root.append(content, {
          at: root.components().indexOf(sibling) + 1,
        })[0];
    }
    if (!added) added = ed.addComponents(content)[0];
    if (added) {
      ed.select(added);
      ed.Canvas.scrollTo(added, { behavior: "smooth" });
      setDirty(true);
    }
  }
  function applyTheme(color: string) {
    const d = snapshot();
    for (const p of d.pages)
      for (const lang of ["vi", "en"] as const)
        p[lang].css += `\n:root{--accent:${color};--yd-accent:${color}}`;
    d.branding.color = color;
    latest.current = d;
    setSite(d);
    editor.current?.setStyle(
      d.pages.find((p) => p.id === pageId)![editLocale].css,
    );
    setDirty(true);
  }
  function ancestors(node: any) {
    const list = [];
    while (node) {
      list.unshift(node);
      node = node.parent();
    }
    return list.slice(-5);
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
    <div
      className={`studio-shell website-studio ${focusMode ? "website-focus" : ""}`}
      aria-busy={busy}
      inert={busy}
    >
      <header className="studio-top">
        <Link
          href="/dashboard"
          onClick={(e) => {
            if (
              dirty &&
              !confirm(
                t(
                  "Rời studio khi còn thay đổi chưa lưu?",
                  "Leave with unsaved changes?",
                ),
              )
            )
              e.preventDefault();
          }}
        >
          ← {t("Không gian của tôi", "My workspace")}
        </Link>
        <input
          aria-label={t("Tên hệ thống", "Site name")}
          value={w.name}
          onChange={(e) => {
            setW({ ...w, name: e.target.value });
            setDirty(true);
          }}
        />
        <span>
          <i className={dirty ? "save-dot dirty" : "save-dot"} />
          {dirty ? t("Chưa lưu", "Unsaved") : t("Đã lưu", "Saved")} · {w.slug} ·
          v{w.revision}
        </span>
        <LocaleSwitch />
        <button
          aria-label={t("Hoàn tác", "Undo")}
          title="Ctrl/⌘ Z"
          onClick={() => editor.current?.UndoManager.undo()}
        >
          <Undo2 size={16} />
        </button>
        <button
          aria-label={t("Làm lại", "Redo")}
          onClick={() => editor.current?.UndoManager.redo()}
        >
          <Redo2 size={16} />
        </button>
        <button
          onClick={() => {
            setPreviewSite(snapshot());
            setPreviewPage(pageId);
          }}
          disabled={!ready}
        >
          <Eye size={16} />
          {t("Xem trước", "Preview")}
        </button>
        <button
          aria-label={t("Chế độ tập trung", "Focus mode")}
          onClick={() => setFocusMode(!focusMode)}
        >
          {focusMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button disabled={!ready || busy} onClick={() => save()}>
          <Save size={15} />
          {t("Lưu nháp", "Save draft")}
        </button>
        <button
          className="button small"
          disabled={!ready || busy}
          onClick={() => save(true)}
        >
          <Send size={15} />
          {t("Xuất bản", "Publish")}
        </button>
        {w.tenant_id && (
          <Link href={"/t/" + w.slug} target="_blank">
            ↗ {t("Xem trang", "Preview")}
          </Link>
        )}
      </header>
      {recovery && (
        <div className="website-recovery">
          <span>
            {t(
              "Có bản nháp trình duyệt chưa lưu.",
              "An unsaved browser draft is available.",
            )}
            {recovery.revision !== w.revision &&
              t(
                " Bản trên hệ thống đã thay đổi; hãy đối chiếu trước khi lưu.",
                " The server version changed; review before saving.",
              )}
          </span>
          <button
            onClick={() => {
              const d = recovery.data as SiteDocument;
              latest.current = d;
              setSite(d);
              setW({
                ...w,
                name: recovery.name,
                slug: w.tenant_id ? w.slug : recovery.slug,
              });
              setPageId(d.pages[0].id);
              editor.current?.setComponents(d.pages[0][editLocale].html);
              editor.current?.setStyle(d.pages[0][editLocale].css);
              setDirty(true);
              setRecovery(null);
            }}
          >
            {t("Khôi phục", "Restore")}
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(`website-draft:${w.owner_id}:${id}`);
              setRecovery(null);
            }}
          >
            {t("Bỏ nháp", "Discard")}
          </button>
        </div>
      )}
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
          value={device}
          onChange={(e) => {
            setDevice(e.target.value);
            editor.current?.setDevice(e.target.value);
          }}
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
        <button
          title={t("Vừa khung thiết kế", "Fit canvas")}
          onClick={() => {
            editor.current?.Canvas.fitViewport({ ignoreHeight: true, gap: 24 });
            setZoom(Math.round(editor.current?.Canvas.getZoom() || 100));
          }}
        >
          {t("Vừa khung", "Fit")}
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
      <div className="studio-body website-body">
        <aside className="website-library">
          <div className="studio-tabs website-tabs">
            {[
              ["gadgets", t("Thư viện", "Library")],
              ["pages", t("Trang/Menu/Logo", "Pages/Menu/Logo")],
              ["layers", t("Lớp", "Layers")],
              ["theme", t("Giao diện", "Theme")],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={panel === key ? "active" : ""}
                onClick={() => setPanel(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div id="yd-gadgets" hidden />
          <div hidden={panel !== "gadgets"}>
            <GadgetLibrary
              editor={ready ? editor.current : null}
              onInsert={insertGadget}
            />
          </div>
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

          {panel === "theme" && (
            <section className="website-theme">
              <small>DESIGN SYSTEM</small>
              <h2>{t("Màu sắc hài hòa.", "A cohesive palette.")}</h2>
              <p>
                {t(
                  "Áp dụng màu thương hiệu trên tất cả trang. Chọn từng thành phần để tinh chỉnh.",
                  "Apply your brand accent across pages. Select components to fine-tune them.",
                )}
              </p>
              <div className="theme-palettes">
                {[
                  ["Forest", "#23776d"],
                  ["Indigo", "#565eb7"],
                  ["Ocean", "#2d73a0"],
                  ["Terracotta", "#ac6349"],
                  ["Rose", "#a95070"],
                  ["Graphite", "#36434a"],
                ].map(([name, color]) => (
                  <button
                    key={name}
                    onClick={() => applyTheme(color)}
                    style={{ borderColor: color }}
                  >
                    <span style={{ background: color }} />
                    <b>{name}</b>
                    <small>{color}</small>
                  </button>
                ))}
              </div>
              <label>
                {t("Màu tùy chọn", "Custom accent")}
                <input
                  type="color"
                  value={site.branding.color}
                  onChange={(e) => applyTheme(e.target.value)}
                />
              </label>
            </section>
          )}
        </aside>
        <div className="website-stage">
          <div className="website-canvas-caption">
            <span>
              <i />
              {page.title[editLocale] || "Home"}
            </span>
            <span>
              {device.toUpperCase()} · {zoom}%
            </span>
            <button
              type="button"
              onClick={() =>
                editor.current?.runCommand("core:component-outline")
              }
            >
              {t("Đường biên", "Outlines")}
            </button>
          </div>
          <main className="studio-canvas" ref={canvas} />
          <div className="website-breadcrumbs">
            {selected ? (
              ancestors(selected).map((node: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => editor.current?.select(node)}
                >
                  {node.getName?.() || node.get("tagName")}{" "}
                  {i < ancestors(selected).length - 1 ? " / " : ""}
                </button>
              ))
            ) : (
              <span>
                {t(
                  "Nhấp để chọn · Nhấp đúp để sửa chữ · Kéo tay nắm để đổi kích thước",
                  "Click to select · Double-click to edit text · Drag handles to resize",
                )}
              </span>
            )}
          </div>
        </div>
        <aside className="website-inspector">
          <header>
            <SlidersHorizontal size={17} />
            <strong>{t("Thuộc tính", "Properties")}</strong>
            <span>{selected?.get("tagName") || "—"}</span>
          </header>
          <section className="website-property-body">
            {selected ? (
              <>
                <div className="website-selection-heading">
                  <strong>
                    {selected.getName?.() || selected.get("tagName")}
                  </strong>
                  <small>{t("Phần tử đang chọn", "Selected element")}</small>
                </div>
                <div className="actions">
                  <button
                    aria-label={t("Di chuyển lên", "Move up")}
                    onClick={() => {
                      const parent = selected.parent();
                      if (parent)
                        selected.move(parent, {
                          at: Math.max(
                            0,
                            parent.components().indexOf(selected) - 1,
                          ),
                        });
                    }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    aria-label={t("Di chuyển xuống", "Move down")}
                    onClick={() => {
                      const parent = selected.parent();
                      if (parent)
                        selected.move(parent, {
                          at: Math.min(
                            parent.components().length,
                            parent.components().indexOf(selected) + 2,
                          ),
                        });
                    }}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => {
                      const parent = selected.parent();
                      if (parent) {
                        const clone = parent.append(selected.clone(), {
                          at: parent.components().indexOf(selected) + 1,
                        })[0];
                        editor.current?.select(clone);
                      }
                    }}
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
                        ["absolute", "fixed"].includes(e.target.value)
                          ? "absolute"
                          : "",
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
        </aside>
      </div>
      {previewSite && (
        <div
          className="website-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("Xem trước website", "Website preview")}
        >
          <header>
            <strong>
              {t("Xem trước bản đang chỉnh sửa", "Preview current draft")}
            </strong>
            <select
              aria-label="Preview page"
              value={previewPage}
              onChange={(e) => setPreviewPage(e.target.value)}
            >
              {previewSite.pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title[editLocale]}
                </option>
              ))}
            </select>
            <span>
              {t("Chưa xuất bản thay đổi", "Changes are not published")}
            </span>
            <button type="button" onClick={() => setPreviewSite(null)}>
              <X size={17} />
              {t("Đóng", "Close")}
            </button>
          </header>
          <div className="website-preview-content">
            <SiteRuntime
              key={previewPage}
              source={
                previewSite.pages.find((p) => p.id === previewPage)![editLocale]
              }
              pages={previewSite.pages}
              courses={previewCourses}
              slug={w.slug}
              title="Draft website preview"
              onNavigate={(href) => {
                const path = new URL(href, location.origin).pathname;
                const target = previewSite.pages.find(
                  (p) => path === `/t/${w.slug}${p.slug ? `/p/${p.slug}` : ""}`,
                );
                if (target) setPreviewPage(target.id);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
