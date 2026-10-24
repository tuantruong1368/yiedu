import type { SitePage } from "./site";

/** Resolve page IDs, edited slugs and imported local links through one route map. */
export function pageHref(
  page: Pick<SitePage, "id" | "slug">,
  slug: string,
  previewBase?: string,
) {
  return previewBase
    ? previewBase + encodeURIComponent(page.id)
    : `/t/${slug}${page.slug ? `/p/${page.slug}` : ""}`;
}
export function resolveSiteHref(
  href: string,
  pages: SitePage[],
  slug: string,
  previewBase?: string,
) {
  if (!href || href.startsWith("#") || /^https:\/\//.test(href)) return href;
  const [path, fragment] = href.split("#", 2);
  const key = path
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/^p\//, "")
    .replace(/\.html$/, "")
    .replace(/\/$/, "");
  const match = pages.find(
    (p) => p.id === key || p.slug === key || (key === "index" && p.slug === ""),
  );
  if (match)
    return (
      pageHref(match, slug, previewBase) + (fragment ? `#${fragment}` : "")
    );
  if (/^\/(login|register)(\?|$)/.test(href)) {
    const url = new URL(href, "https://tenant.invalid");
    url.searchParams.set("site", slug);
    return url.pathname + url.search;
  }
  return href;
}
