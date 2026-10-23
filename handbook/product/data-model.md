# P4.2 — Thiết kế dữ liệu

## Đã triển khai trong migration 0001

| Bảng | Cột chính | Ràng buộc |
|---|---|---|
| tenants | id UUID, slug, name, branding JSONB, created_at | PK id, UNIQUE slug |
| courses | id UUID, tenant_id, slug, title, created_at | FK tenant_id, UNIQUE (tenant_id, slug), index tenant_id |

UUID được tạo tại ứng dụng. created_at do database tạo với timezone. Branding là dữ liệu cấu hình
thử nghiệm, chưa có schema kiểm tra màu/logo riêng. Schema ORM và migration phải khớp.

## Mô hình mục tiêu, chưa có migration

| Thực thể | Quan hệ / quy tắc |
|---|---|
| users | Danh tính toàn cục; dữ liệu cá nhân tối thiểu |
| memberships | user + tenant + role; unique tenant/user |
| lessons | Thuộc course trong cùng tenant; thứ tự và trạng thái |
| enrollments | user/course/tenant; unique trong phạm vi ghi danh |
| lesson_progress | enrollment/lesson, trạng thái, phiên bản; idempotent |
| pages, page_revisions | tenant, slug, locale; JSONB, schema_version, publish pointer |
| media | tenant, object key, mime, size, checksum, access policy |
| quizzes, questions, attempts | tenant; đáp án và lần làm có quyền truy cập riêng |
| plans, subscriptions | Control Plane; tách khỏi learning runtime |
| orders, payments, webhook_events | Giá trị tiền chính xác; event id unique, trạng thái nghiệp vụ |
| export_jobs, audit_events | Trạng thái job, actor, tenant, manifest và log an toàn |

## Quy tắc phát triển schema

Không lưu video binary trong DB. Không gom khóa học/học viên/đơn hàng vào một JSON lớn.
JSONB chỉ dùng cho cấu trúc linh hoạt như page data và cấu hình.
Thêm tenant_id vào ràng buộc liên bảng để ngăn tham chiếu chéo tenant khi bảng mở rộng.
Migration production theo expand → backfill → chuyển code → contract; rollback phải cân nhắc mất dữ liệu.

## Xuất một tenant

Không dùng pg_dump toàn DB SaaS gửi khách hàng. Cần export có whitelist bảng, chọn tenant,
thu thập quan hệ phụ thuộc, tách identity/PII, kiểm số lượng và chạy restore ở DB sạch.
pg_dump phù hợp backup DB hoặc export DB đã tách; không thay thế quy trình tenant export.

## Domain model v0.2 — CHƯA có migration

| Nhóm | Thực thể đề xuất và ràng buộc |
|---|---|
| Identity | users, external_identities (unique issuer/subject), memberships (tenant/user unique), roles/permissions |
| Builder | template_selections, workspaces (owner/state), pages/revisions, template_overrides (base version) |
| Provisioning | tenant_domains (hostname unique/verified), provisioning_jobs (owner/idempotency unique), job_steps |
| Learning | learning_paths/path_versions/path_items, prerequisites, enrollments/progress, lessons/revisions |
| Distribution | packages (vendor/name unique), package_versions (immutable package/version), dependencies, release_channels |
| Tenant config | extension_installations (tenant/package unique), configs/revisions, migration_state theo deployment/instance |
| Marketplace | seller_profiles, listings/reviews, orders/payments, entitlements/license_grants, ledger/refunds/payouts |
| Export/update | export_jobs/manifests, installations/instances, update_policies/jobs, audit/outbox events |

User identity toàn cục không đồng nghĩa export toàn bộ users: chỉ membership và data được phép của tenant,
có ánh xạ identity đích. Ledger/payout/platform key ở Control Plane, không đóng vào ZIP.
Domain unique ở registry, runtime tenant UUID không suy ra trực tiếp từ Host. Cấu hình tenant và
artifact version là dữ liệu khác nhau; migration schema shared không chạy lại mỗi lần tenant bật plugin.
Mọi bảng mới sẽ có migration riêng và test khi triển khai; migration 0001 giữ nguyên.
