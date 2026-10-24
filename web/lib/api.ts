export const API = process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
export async function api<T = any>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch("/api/v1" + path, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    const body = await res
      .json()
      .catch(() => ({ detail: "Không thể kết nối hệ thống" }));
    throw new Error(
      typeof body.detail === "string"
        ? body.detail
        : "Dữ liệu không hợp lệ. Kiểm tra lại các trường.",
    );
  }
  if (res.status === 204) return null as T;
  return res.json();
}
export async function publicApi(path: string) {
  const response = await fetch(API + "/api/v1" + path, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 63);
}
