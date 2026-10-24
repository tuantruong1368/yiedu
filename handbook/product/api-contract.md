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

## API mục tiêu v0.2 — CHƯA được tạo endpoint

| Miền | Thao tác/contract dự kiến | Auth và tính nhất quán |
|---|---|---|
| Catalog | List template, preview, package versions | Public chỉ metadata đã publish |
| Identity | Provider callback, session, membership | Provider verify, state/nonce, scope/role |
| Builder | Workspace CRUD, revisions, preview/publish | Owner/member, optimistic revision control |
| Provisioning | Reserve slug, create job, get status | Owner/quota/idempotency; active sau kiểm tra |
| Learning | Courses/lessons/paths/enrollments/progress | Tenant membership, entitlement, prerequisite |
| Extensions | Catalog/plan/install/enable/update/uninstall | Role/capability/compatibility, async jobs |
| Export/update | Request job, manifest/download grant/status | Owner/operator, idempotency, signed artifacts |
| Marketplace | Seller/package submit/review/order/license | Seller/reviewer separation, webhook verification |
| Discovery | Well-known instance info/capabilities | Metadata không chứa secret; verified origin, API/auth issuer |

Đây là nhóm hợp đồng cần thiết kế OpenAPI khi viết story. Endpoint scaffold hiện tại giữ nguyên;
không trả thành công giả hoặc mock API cho chức năng chưa triển khai. Validator manifest offline
không mở endpoint cài code và không phải hệ thống phân phối package.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.

API product thực ở `/auth`, `/me/dashboard`, `/workspaces`, `/sites`, `/runtime`, `/developer/packages`,
`/catalog`, `/instance`, `/marketplace`; xem `/openapi.json` của bản 0.3.0.
Chưa có provider OAuth, billing, AI hoặc signed updater endpoint thực thi.

## Cập nhật authoring 0.4 — 24/10/2026

[CR-002: FR-026–034](changes/CR-002-authoring-i18n.md) và [trạng thái 0.4](release-0.4.md)
quản lý phần đa ngôn ngữ, builder mới và công cụ tạo bài học.
Workspace data chấp nhận Puck cũ hoặc SiteDocument 2.0 (pages/menu/branding/VI/EN);
LessonWrite/lesson response thêm document và translations. Alembic 0003 thêm JSONB document nullable,
translations mặc định {}; body/document/translation không trả trong overview cho học viên.
Snapshot mới 0003, restore nhận 0002/0003.
GrapesJS được chọn cho HTML/CSS/free layout; Tiptap cho rich lesson và extension node.
EditorContribution chỉ khai báo module/slot/license; không cấp quyền thực thi hoặc chứng minh đã mua.
