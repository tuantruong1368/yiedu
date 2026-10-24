import { publicApi } from "@/lib/api";
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const data = await publicApi(`/catalog/templates/${encodeURIComponent(id)}`);
  if (!data) return new Response("Template not found", { status: 404 });
  const locale =
    new URL(request.url).searchParams.get("locale") === "en" ? "en" : "vi";
  const doc = data.document,
    page = doc.pages.find((p: any) => !p.slug),
    source = page[locale];
  const nav = doc.menu
    .map((m: any) => `<span>${esc(m.label[locale])}</span>`)
    .join("");
  const header = `<header class="preview-nav"><b><i>${esc(doc.branding.text.slice(0, 1))}</i>${esc(doc.branding.text)}</b><nav>${nav}</nav><span>VI / EN</span></header>`;
  return new Response(
    `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=1280"><title>${esc(data.template.name)}</title><style>${source.css.replace(/</g, "\\3c ")}.preview-nav{padding:22px 5%;display:flex;align-items:center;justify-content:space-between;background:white;gap:24px;font:14px Arial,sans-serif;color:#20332e}.preview-nav b{display:flex;align-items:center;gap:10px;font-size:21px}.preview-nav i{font-style:normal;display:grid;place-items:center;background:${doc.branding.color};color:white;border-radius:9px;width:34px;height:34px}.preview-nav nav{display:flex;gap:24px}</style></head><body>${header}${source.html}</body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' https: data:; frame-ancestors 'self'; base-uri 'none'; form-action 'none'",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
