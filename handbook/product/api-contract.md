# P4.3 — Hợp đồng API bộ nền

API version 0.1.0. Nguồn chính xác có thể máy đọc: `/openapi.json` khi chạy API.
Swagger UI: `/docs`. Chỉ dùng local, chưa tích hợp frontend/mobile.

| Method | Endpoint | Quyền | Kết quả |
|---|---|---|---|
| GET | /health/live | Public | 200: tiến trình đang sống |
| GET | /health/ready | Public local | 200: DB kết nối được; 503 khi DB lỗi |
| POST | /api/v1/tenants | Platform admin | 201 hoặc 409 khi slug trùng |
| GET | /api/v1/tenants | Platform admin | Danh sách, limit 1–100, offset >= 0 |
| POST | /api/v1/tenants/{tenant_id}/courses | Platform admin | 201; 404 tenant không có; 409 trùng slug |
| GET | /api/v1/tenants/{tenant_id}/courses | Platform admin | Danh sách riêng của tenant, có phân trang |

Header quản trị: `X-Admin-Key`. Không có key/sai key trả 401. UUID/slug/body sai trả 422.
Key được so sánh constant-time, không lưu trong source. Đây là platform key có quyền toàn bộ,
không phải token tenant; không nhúng key này trong browser/app mobile hoặc phát cho khách hàng.
Readiness chỉ kiểm SELECT 1, chưa kiểm schema/migration/queue/storage.

## Payload ví dụ

Tạo tenant:

```json
{"slug":"yirobot-demo","name":"Yirobot Demo","branding":{"primaryColor":"#167D8D"}}
```

Tạo course:

```json
{"slug":"robot-co-ban","title":"Robot cơ bản"}
```

Thứ tự thử: Authorize → tạo tenant → sao chép id → tạo course → list course.
Script tự động: `python scripts/smoke.py`. Mỗi lần tạo dữ liệu mới trong DB local.
Không có DELETE/UPDATE ở bộ nền; không coi đây là CRUD đầy đủ.

## Quy ước API mục tiêu

Thêm request ID, error schema thống nhất, auth token và membership, rate limit, idempotency cho
thanh toán/job trước khi public. Version API được quản lý độc lập UI; Server Actions không dùng
thay hợp đồng HTTP cho mobile. Khi đổi schema, cập nhật OpenAPI và client sau review.
