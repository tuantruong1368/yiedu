# P3 — SRS YiEdu: yêu cầu và tiêu chí chấp nhận

Trạng thái v0.2: yêu cầu sản phẩm ghi nhận từ anh Tuân; thiết kế/AC cần review, chưa là tính năng đã triển khai.
Từ “phải” trong bảng là yêu cầu mục tiêu, chưa là cam kết phát hành.

## Thuật ngữ

Tenant: một hệ thống e-learning của khách hàng. Platform admin: quản trị toàn nền tảng.
Tenant owner/admin: quản trị trong tenant. Instructor: giảng viên. Learner: học viên.
Control Plane: quản lý dịch vụ YiEdu. LMS Runtime: phần e-learning có thể tách triển khai.
Một user có thể có membership ở nhiều tenant với vai trò khác nhau.

## Yêu cầu chức năng

| ID | Năng lực | Tiêu chí chấp nhận mục tiêu |
|---|---|---|
| FR-001 | Tạo tenant | Tên hợp lệ, slug duy nhất, lưu được và trả mã ID; trùng trả 409 |
| FR-002 | Đăng nhập và membership | Owner Google/Facebook/email; learner đăng ký tại tenant; quyền server-side theo membership |
| FR-003 | Branding | Lưu logo/màu/tên; hiển thị đúng tenant sau tải lại |
| FR-004 | Page builder | Lưu nháp, preview, publish, phục hồi revision; render đúng trang tenant |
| FR-005 | Khóa học và bài học | Quản lý cấu trúc; phân biệt draft/published; chỉ học viên đủ quyền xem |
| FR-006 | Ghi danh và tiến độ | Ghi danh không trùng; cập nhật tiến độ idempotent, không vượt quyền |
| FR-007 | Bài kiểm tra | Lưu lần làm, chấm theo quy tắc; học viên không đọc được đáp án trước phép |
| FR-008 | Thuê bao/thanh toán | Webhook xác thực, xử lý lặp không cấp quyền/ghi tiền hai lần |
| FR-009 | Mobile | App YiEdu chung iOS/Android, chọn tenant, học đúng lộ trình, đồng bộ tiến độ; kiểm identity standalone |
| FR-010 | AI hỗ trợ | Chỉ truy cập tài liệu được phép; giới hạn chi phí và ghi nhận lỗi |
| FR-011 | Xuất độc lập | ZIP gồm runtime/homepage/admin/data/media; restore local/server sạch; identity và updater được cấu hình riêng |
| FR-012 | Web công khai và SEO | Việt/Anh, HTML có nội dung, metadata/canonical đúng tên miền, sitemap |
| FR-013 | Quản trị dịch vụ | Quản lý gói và tenant, lưu audit khi thao tác nhạy cảm |
| FR-014 | Handbook và học quản lý dự án | Có P0–P9, hướng dẫn thực hành; quyền khu học public cần quyết định |
| FR-015 | Template-first onboarding | Giữ template ID/version qua Google/Facebook/email, lỗi/hủy đăng ký có thể tiếp tục |
| FR-016 | Draft workspace và builder | Chỉnh thương hiệu/trang, preview private, revision; chưa publish thì chưa public |
| FR-017 | Provision subdomain | Publish tạo đúng một tenant, homepage và admin; slug duy nhất, retry an toàn |
| FR-018 | Quản trị và lộ trình | CRUD course/lesson/path, quyền theo role, prerequisite/version/hoàn thành |
| FR-019 | Tenant signup và app discovery | Learner membership đúng tenant, app chọn tenant; standalone login theo issuer đích |
| FR-020 | ZIP có thể triển khai | Installer/config/data/media + compatibility/license checks + restore drill |
| FR-021 | Core/extension updates | Signed releases, preflight, backup/migration/health, policy và recovery |
| FR-022 | Extension lifecycle | Catalog/install/enable/disable/update/uninstall; quyền, dependency và dữ liệu |
| FR-023 | Developer marketplace | Submit/review/publish/sell, entitlement, refund/payout audit |
| FR-024 | SDK và compatibility | Manifest/version/event/capability contract, docs/example/validation |
| FR-025 | Provision/export/update jobs | State machine, idempotency, lock, retry, audit; không báo thành công sớm |

## Yêu cầu phi chức năng

| ID | Nội dung | Cách chứng minh |
|---|---|---|
| NFR-001 | Cô lập tenant toàn bộ DB/file/cache/task/search/export | Negative test ma trận vai trò, tenant và tài nguyên |
| NFR-002 | Tính nhất quán nghiệp vụ | Ràng buộc DB, transaction, test xung đột và retry |
| NFR-003 | Quan sát và bảo mật | Log có request ID, không log secret/PII; alert và test quyền |
| NFR-004 | Khôi phục | Diễn tập restore, đo RPO/RTO; chỉ tiêu cần thống nhất trước release |
| NFR-005 | Hiệu năng | Đo p95 và tỷ lệ lỗi với workload được chốt; chưa đặt SLA tùy ý |
| NFR-006 | Khả năng di chuyển | Runtime và schema chạy được trên PostgreSQL độc lập; adapter dịch vụ |
| NFR-007 | Khả năng tiếp cận | Kiểm bàn phím, nhãn, tương phản ở các luồng chính |

## Quy tắc dữ liệu quan trọng

Tenant slug duy nhất toàn nền tảng. Course slug duy nhất trong tenant, được phép trùng ở tenant khác.
Mọi truy cập tài nguyên phải kiểm tra membership/role; tenant_id từ URL không chứng minh quyền.
Dữ liệu trang editor cần schema_version và xác thực component/props phía server trước publish.
Giá và số tiền dùng numeric hoặc đơn vị tiền nhỏ nhất, không dùng float.

## Truy vết bộ nền

| Yêu cầu | Code hiện tại | Bằng chứng / giới hạn |
|---|---|---|
| FR-001 | POST/GET tenants | Test PostgreSQL; chỉ admin, chưa onboarding khách hàng |
| FR-005 | POST/GET courses | Chỉ tạo/list metadata, chưa bài học hay publish |
| NFR-001 | courses lọc theo tenant_id | Test danh sách riêng; chưa tenant auth/RLS nên chưa đạt yêu cầu |
| FR-014 | Handbook | Kiểm link/build; chưa triển khai khu học trên sản phẩm |

Các FR còn lại đang backlog. Xem [backlog](backlog.md) và [kế hoạch test](test-plan.md).

## Quy tắc v0.2 và AC chi tiết

[Onboarding](onboarding-builder.md) AC-015/016/017; [identity/mobile](identity-mobile.md) AC-018/019;
[export](standalone-export.md) AC-020; [updates](updates.md) AC-021;
[extensions](extensions.md) AC-022/024; [marketplace](marketplace.md) AC-023/024.
[Truy vết](traceability-v2.md) liên kết FR → BL → test/UAT và trạng thái code.

| ID bổ sung | Yêu cầu mục tiêu | Cách chứng minh |
|---|---|---|
| NFR-008 | Extension không có quyền ngầm với tenant khác/host | Security tests với capability/host isolation |
| NFR-009 | Update giữ content/config, kiểm authenticity/compatibility | Signed release tests và recovery drill |
| NFR-010 | Domain/callback/deep link/discovery không rò credential | Negative tests host/origin/issuer/redirect |
FR-025 dùng AC-017-01/03, AC-020-02 và AC-021-03 cho từng job tương ứng.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.

## Cập nhật authoring 0.4 — 24/10/2026

[CR-002: FR-026–034](changes/CR-002-authoring-i18n.md) và [trạng thái 0.4](release-0.4.md)
quản lý phần đa ngôn ngữ, builder mới và công cụ tạo bài học.
Workspace data chấp nhận Puck cũ hoặc SiteDocument 2.0 (pages/menu/branding/VI/EN);
LessonWrite/lesson response thêm document và translations. Alembic 0003 thêm JSONB document nullable,
translations mặc định {}; body/document/translation không trả trong overview cho học viên.
Snapshot mới 0003, restore nhận 0002/0003.
GrapesJS được chọn cho HTML/CSS/free layout; Tiptap cho rich lesson và extension node.
EditorContribution chỉ khai báo module/slot/license; không cấp quyền thực thi hoặc chứng minh đã mua.

## CR-003: template và nội dung khởi tạo

FR-035: Danh mục theo mục đích sử dụng, website nhiều trang VI/EN, xem trước bài/lộ trình,
copy nội dung riêng vào tenant lúc xuất bản đầu; republish giữ nội dung khách sửa.
Robot/Software có bản đồ 8 học kỳ. Học liệu cô đọng phải công bố trạng thái draft và nguồn đọc;
bộ giáo trình đại học đầy đủ và nghiệm thu chuyên gia vẫn là phần chưa hoàn tất.


## Mở rộng 0.9 — CR-007

| Mã | Yêu cầu | Điều kiện kiểm |
| --- | --- | --- |
| FR-026 | Nhận diện và homepage YiEdu cấu hình được | SVG, full-width responsive, appearance VI/EN có revision |
| FR-027 | Sửa/archive/restore hệ thống và thiết kế | Owner/tenant ACL, website và dữ liệu được giữ |
| FR-028 | Platform admin quản lý catalog và khách hàng | Server-provisioned role, template Studio/curriculum, audit |
| FR-029 | AI tạo template/khóa học | Encrypted key, quotas, schema validation, review/apply idempotent |
| FR-030 | Bán khóa lẻ hoặc combo, có miễn phí | Paid gate, frozen price/course snapshot, prerequisites |
| FR-031 | PayPal/MoMo/ngân hàng về seller | Receiver/currency/signature verification, order ledger/reconciliation |
| FR-032 | Thu phí tenant và trial 30 ngày | Owner anchor, prepaid terms/quotas, giữ quyền học khi hết hạn |
