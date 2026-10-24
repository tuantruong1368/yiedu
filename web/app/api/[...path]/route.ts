import { NextRequest } from "next/server";
import { API } from "@/lib/api";
export const dynamic = "force-dynamic";
async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path[0] !== "v1" || path.some((x) => x === ".." || x.includes("/")))
    return new Response("Not found", { status: 404 });
  const data = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();
  if (data && data.byteLength > 2 * 1024 * 1024)
    return new Response("Too large", { status: 413 });
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "authorization", "origin"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("accept-encoding", "identity");
  try {
    const upstream = await fetch(
      `${API}/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`,
      {
        method: request.method,
        headers,
        body: data,
        cache: "no-store",
        redirect: "manual",
      },
    );
    const result = new Headers();
    for (const name of [
      "content-type",
      "content-disposition",
      "cache-control",
      "content-security-policy",
      "x-content-type-options",
    ]) {
      const value = upstream.headers.get(name);
      if (value) result.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie())
      result.append("set-cookie", cookie);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: result,
    });
  } catch {
    return Response.json(
      { detail: "API chưa sẵn sàng. Kiểm tra database và tiến trình FastAPI." },
      { status: 503 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
