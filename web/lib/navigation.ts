/** Keep return links local and inside the current tenant's administration. */
export function tenantAdminURL(slug: string, tab = "overview") {
  return `/t/${encodeURIComponent(slug)}/administrator${tab === "overview" ? "" : `?tab=${encodeURIComponent(tab)}`}`;
}
export function tenantReturnURL(
  slug: string,
  value?: string | null,
  fallback?: string,
) {
  const base = tenantAdminURL(slug),
    next = value || "";
  if (
    next.length > 4000 ||
    !next.startsWith("/") ||
    /^\/\//.test(next) ||
    /[\\\x00-\x20]/.test(next)
  )
    return fallback || tenantAdminURL(slug, "studio");
  try {
    const url = new URL(next, "https://yiedu.invalid");
    if (
      url.origin !== "https://yiedu.invalid" ||
      (url.pathname !== base && !url.pathname.startsWith(base + "/"))
    )
      return fallback || tenantAdminURL(slug, "studio");
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback || tenantAdminURL(slug, "studio");
  }
}
export function galleryReturnURL(value?: string | null) {
  try {
    const url = new URL(value || "/#templates", "https://yiedu.invalid");
    if (url.origin !== "https://yiedu.invalid" || url.pathname !== "/")
      return "/#templates";
    const params = new URLSearchParams();
    for (const key of ["group", "q"]) {
      const value = url.searchParams.get(key);
      if (value) params.set(key, value.slice(0, 160));
    }
    return `/${params.size ? `?${params}` : ""}#templates`;
  } catch {
    return "/#templates";
  }
}
