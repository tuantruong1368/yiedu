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
    if (url.origin === "https://yiedu.invalid" && url.pathname === "/platform")
      return "/platform?tab=templates";
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

/** Explicit account routes only; never accept a remote post-login redirect. */
export function accountReturnURL(
  value?: string | null,
  fallback = "/dashboard",
) {
  if (!value || value.length > 4000 || /[\\\x00-\x20]/.test(value))
    return fallback;
  try {
    const url = new URL(value, "https://yiedu.invalid");
    if (
      url.origin !== "https://yiedu.invalid" ||
      !(
        /^\/checkout\/[a-f0-9-]{36}$/.test(url.pathname) ||
        ["/platform", "/orders", "/dashboard"].includes(url.pathname)
      )
    )
      return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** Contextual checkout back link, limited to account pages or this tenant. */
export function checkoutReturnURL(
  slug: string,
  value?: string | null,
  fallback = "/orders",
) {
  if (!value || value.length > 4000 || /[\\\x00-\x20]/.test(value))
    return fallback;
  try {
    const url = new URL(value, "https://yiedu.invalid");
    if (url.origin !== "https://yiedu.invalid") return fallback;
    if (
      url.pathname === `/t/${encodeURIComponent(slug)}/learn` ||
      url.pathname === tenantAdminURL(slug)
    )
      return url.pathname + url.search + url.hash;
    if (["/dashboard", "/orders", "/platform"].includes(url.pathname))
      return accountReturnURL(value, fallback);
  } catch {}
  return fallback;
}
