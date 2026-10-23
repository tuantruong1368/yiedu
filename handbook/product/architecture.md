# P4 — Kiến trúc YiEdu

Trạng thái: backend scaffold đã có; kiến trúc sản phẩm đầy đủ bên dưới là đề xuất.

## Nguyên tắc

Một backend chia module rõ ràng trước, chưa microservices. API version `/api/v1`.
Nghiệp vụ chính ở FastAPI, web/mobile cùng gọi API. PostgreSQL là nguồn dữ liệu nghiệp vụ.
Storage lưu file; DB lưu metadata và quyền. Worker xử lý tác vụ dài qua hàng đợi khi cần.

## Ranh giới module mục tiêu

| Nhóm | Module | Trách nhiệm |
|---|---|---|
| Control Plane | Tenancy, billing, provisioning, export | Vòng đời dịch vụ và khách hàng |
| Runtime | Identity/membership, branding/pages, learning, assessment | Vận hành học tập độc lập |
| Hỗ trợ | Media, notification, AI adapters, audit | Dịch vụ dùng chung có kiểm tra tenant |

Scaffold hiện chỉ có model/schema/router tenant và course. Sẽ tách module khi có thêm nghiệp vụ,
không dựng hàng chục service chỉ để khớp sơ đồ.

## Luồng request mục tiêu

Xác thực token → lấy user → kiểm membership/role → xác định tenant tin cậy →
truy vấn DB trong transaction có tenant context → trả schema công khai.
Luồng này CHƯA có trong scaffold: API hiện chỉ cho platform admin với X-Admin-Key.

## Thiết kế nhiều tenant

Đề xuất shared database với tenant_id; composite unique/FK kiểm soát liên kết chéo tenant khi
thêm bảng. Bổ sung RLS qua migration, dùng DB role không bypass RLS và tenant context trong
transaction; test cả connection pool reuse để tránh tenant context rò rỉ.
Platform operations và job nền cần đường quyền riêng có audit.

Tenant isolation không chỉ DB: key storage, cache, queue payload, vector search và export cũng
phải mang tenant context. Không tin tenant_id do client gửi khi chưa kiểm membership.

## Web, mobile và SEO

Next.js/Puck là đề xuất: editor lưu data; public renderer render HTML từ revision đã publish.
Metadata, canonical và sitemap theo hostname đã xác minh của tenant. Không tự index demo.
React Native/Expo là đề xuất. Puck React DOM không tự chạy thành native UI; cần mobile renderer
hoặc giới hạn page builder cho web. Dùng chung API không có nghĩa dùng chung toàn bộ giao diện.

## AI và tác vụ dài

Nếu chỉ gọi Gemini, Python không phải điều kiện bắt buộc. Python được chọn cho backend và
khả năng xử lý dữ liệu sau này. Khi có job nặng, dùng worker/job riêng, retry có idempotency,
không giữ request HTTP chờ toàn bộ tác vụ export/video.

## Runtime độc lập

Xuất schema/dữ liệu trong phạm vi tenant, file, component renderer, revision và manifest phiên bản.
Control Plane/billing SaaS không được ngầm đi kèm bản xuất. Identity, email, storage và AI cần
adapter/cấu hình thay thế; không tuyên bố dịch vụ Google tự biến thành code có thể tự host.
Thực hiện restore drill và kiểm giấy phép trước khi bán.

## Local và production

Local: API loopback + PostgreSQL Docker. Production dự kiến: Cloud Run, Cloud SQL, storage,
secret manager; chưa tạo hạ tầng, chưa phê duyệt chi phí. Container local không phải cấu hình
production: cần HTTPS, DB private networking, secret injection, backup, giám sát và auth thật.

## Kiến trúc mục tiêu v0.2

| Ranh giới | Module mục tiêu | Mã đã có? |
|---|---|---|
| Control Plane | Gallery/catalog, onboarding/workspaces, provisioning/domains, billing/export orchestration | Chỉ CRUD tenant admin nền |
| Portable Runtime | Auth adapters, ACL/membership, pages/template, courses/lessons/paths, assessments/media | Chỉ course metadata nền |
| Distribution | Package registry, release signing, updater, installer, entitlement và SDK | Chỉ metadata validator thử nghiệm |
| Marketplace | Developer/seller portal, review, order/ledger/payout, support | Chưa |
| Clients | Website YiEdu, builder, tenant public/admin, app học chung | Chưa |

Đây là ranh giới logic, không yêu cầu tách thành từng microservice ngay. Core Python + database giữ nguyên.
Frontend marketplace/builder và portable tenant renderer/admin có thể là app/build entry riêng để ZIP
không mang theo Control Plane hoặc seller financial data. Runtime và core API có version độc lập với UI.

[Onboarding](onboarding-builder.md) quy định draft → provisioning → active và domain routing.
[Identity/mobile](identity-mobile.md) quy định account/membership và instance discovery sau export.
[Extensions](extensions.md) quy định trust model và schema migration shared/standalone.
[Updates](updates.md) quy định authenticity, staged rollout và recovery.
Không tự tạo backend/website riêng cho mỗi tenant dùng chung; export mới đóng một instance riêng.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.
