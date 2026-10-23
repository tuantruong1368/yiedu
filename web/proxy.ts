import { NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const root = process.env.ROOT_DOMAIN || "localhost";
  const hostname = request.nextUrl.hostname;
  if (
    hostname.endsWith("." + root) &&
    ![
      "/login",
      "/register",
      "/dashboard",
      "/developer",
      "/marketplace",
    ].includes(request.nextUrl.pathname) &&
    !request.nextUrl.pathname.startsWith("/builder/")
  ) {
    const slug = hostname.slice(0, -root.length - 1);
    if (
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
      ![
        "www",
        "api",
        "auth",
        "admin",
        "developer",
        "marketplace",
        "updates",
      ].includes(slug) &&
      !request.nextUrl.pathname.startsWith("/t/")
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/t/" + slug + (url.pathname === "/" ? "" : url.pathname);
      return NextResponse.rewrite(url);
    }
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!api|_next|favicon.ico).*)"] };
