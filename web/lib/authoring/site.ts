import DOMPurify from "dompurify";
export type Source = { html: string; css: string };
export type SitePage = {
  id: string;
  slug: string;
  title: { vi: string; en: string };
  vi: Source;
  en: Source;
};
export type SiteDocument = {
  schema_version: "2.0";
  engine: "grapesjs";
  default_locale: "vi" | "en";
  branding: {
    text: string;
    logo_url: string;
    color: string;
    variant: "rounded" | "circle" | "square";
  };
  pages: SitePage[];
  menu: { id: string; page_id: string; label: { vi: string; en: string } }[];
};
export const baseCss = `*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#182f27;background:#fff}section{padding:64px 7%;position:relative}h1{font-size:clamp(32px,5vw,64px);line-height:1.1}h2{font-size:32px}p{line-height:1.7}img{max-width:100%;height:auto}button,.yd-button{display:inline-block;padding:14px 24px;background:#215d4c;color:white;border:0;border-radius:8px;text-decoration:none;cursor:pointer}a{color:inherit}.yd-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.yd-columns>div{padding:24px;min-height:120px}.yd-course-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px}.yd-course{padding:24px;border:1px solid #dde5df;border-radius:12px}.yd-background{background:#eaf1ed;min-height:250px}@media(max-width:600px){.yd-columns{grid-template-columns:1fr}section{padding:32px 20px}[style*="position: absolute"]{max-width:100%}}`;
export function esc(v: unknown) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function sanitizeImport(html: string) {
  return DOMPurify.sanitize(html, {
    FORBID_TAGS: [
      "script",
      "iframe",
      "object",
      "embed",
      "link",
      "meta",
      "base",
      "svg",
      "math",
    ],
    FORBID_ATTR: ["srcdoc", "formaction", "action"],
    ALLOW_DATA_ATTR: true,
  });
}
export function normalizeSite(w: any): SiteDocument {
  if (w.data?.schema_version === "2.0") return structuredClone(w.data);
  const html = (w.data?.content || [])
    .map((b: any) => {
      const p = b.props || {};
      switch (b.type) {
        case "Hero":
          return `<section style="background:#eaf1ed"><small>${esc(p.eyebrow)}</small><h1>${esc(p.title)}</h1><p>${esc(p.description)}</p><a class="yd-button" href="#courses">${esc(p.buttonText)}</a></section>`;
        case "Text":
          return `<section><h2>${esc(p.title)}</h2><p>${esc(p.body)}</p></section>`;
        case "Courses":
          return `<section id="courses" data-gadget="yiedu.courses"><h2>${esc(p.title)}</h2><div data-courses-placeholder="true">Các khóa học đã xuất bản / Published courses</div></section>`;
        case "Stats":
          return `<section class="yd-columns"><p>${esc(p.first)}</p><p>${esc(p.second)}</p><p>${esc(p.third)}</p></section>`;
        default:
          return "";
      }
    })
    .join("");
  const english = `<section style="background:#eaf1ed"><small>WELCOME TO ${esc(w.name)}</small><h1>Learn today. Build your tomorrow.</h1><p>Explore learning paths, practical courses and new possibilities.</p><a class="yd-button" href="#courses">Explore courses</a></section><section data-gadget="yiedu.courses" id="courses"><h2>Featured courses</h2></section>`;
  return {
    schema_version: "2.0",
    engine: "grapesjs",
    default_locale: "vi",
    branding: {
      text: w.name,
      logo_url: "",
      color: "#215d4c",
      variant: "rounded",
    },
    pages: [
      {
        id: "home",
        slug: "",
        title: { vi: "Trang chủ", en: "Home" },
        vi: { html, css: baseCss },
        en: { html: english, css: baseCss },
      },
    ],
    menu: [
      {
        id: "home-menu",
        page_id: "home",
        label: { vi: "Trang chủ", en: "Home" },
      },
    ],
  };
}
