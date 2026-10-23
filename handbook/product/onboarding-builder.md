# FR-015–017 — Template, đăng ký, builder và subdomain

Trạng thái: đặc tả mục tiêu, chưa có UI/provisioning chạy thật.

## Luồng và trạng thái

| Trạng thái | Hành động | Quy tắc |
|---|---|---|
| Template selected | Chọn mẫu công khai | Ghi template ID/version, không tin giá/quyền từ client |
| Awaiting identity | Đăng ký/đăng nhập | Google, Facebook hoặc email; state/nonce, redirect allowlist |
| Workspace draft | Vào builder | Tạo draft thuộc owner; chưa công khai hostname |
| Provisioning requested | Bấm tạo hệ thống | Kiểm quyền, slug, entitlement và idempotency key |
| Provisioning | Tạo tenant/domain/admin/config | Job retry không sinh hai tenant hoặc chiếm slug hai lần |
| Active | Publish thành công | Homepage public, `/administrator` bắt đăng nhập/role |
| Failed | DNS/TLS/job lỗi | Hiển thị trạng thái, retry/giải phóng theo quy tắc; không báo thành công giả |

Workspace là không gian chỉnh sửa nháp, khác tenant public. Có thể dùng chung storage DB với
cờ trạng thái trong triển khai nhưng phải giữ hành vi không public trước bước publish.
Chọn template trả phí phải có entitlement/trial đúng chính sách; chính sách giá chưa chốt.
OAuth cancel/fail quay lại lựa chọn với thông báo, không mất template; return path không là URL tùy ý.

## Routing mục tiêu

| URL | Chức năng |
|---|---|
| yiedu.vn/templates | Danh sách/xem trước template |
| yiedu.vn/register | Đăng ký, tiếp tục template đã chọn |
| yiedu.vn/builder/{workspace_id} | Chỉnh draft đã xác thực owner |
| yisoft.yiedu.vn/ | Homepage đã publish của tenant |
| yisoft.yiedu.vn/administrator | Quản trị tenant |
| yisoft.yiedu.vn/learn | Khu học trên web |

Không đổi endpoint API admin scaffold thành API onboarding public. API provisioning phải kiểm auth,
quota/abuse và xác thực dữ liệu khác với X-Admin-Key local.

## Domain và bảo vệ ranh giới

Đề xuất wildcard DNS/TLS qua gateway/load balancer, route hostname → tenant_domains → tenant UUID.
Không tạo folder/code/database cho mỗi subdomain của shared SaaS; tài nguyên chung, data tách logic.
Giữ registry slug duy nhất bằng transaction/unique constraint; chặn reserved names như www, api,
auth, admin, marketplace, developer, updates; chống race và subdomain takeover khi xóa tenant.
Host được gateway kiểm tra/chuẩn hóa; không tin X-Forwarded-Host từ kết nối không qua proxy tin cậy.
Cookie host-only; không chia cookie quản trị cho toàn `.yiedu.vn`. Chưa triển khai DNS/TLS.
Cloud Run domain mapping trực tiếp không là lựa chọn mặc định cho wildcard; xem [nghiên cứu](research.md).

## Builder và publish

Branding, trang, menu, responsive preview, alt text, metadata, locale Việt/Anh và revision.
Template gốc immutable; tenant sửa cấu hình/override riêng. Update template không ghi đè nội dung
đã sửa. Publish revision nguyên tử và có đường quay về revision trước; sanitize rich text/URL.
Puck là ứng viên cho homepage; admin hệ thống có menu/module định nghĩa bởi runtime/extension,
không để page builder tự sinh quyền backend. Trình tạo bài giảng có schema/block riêng cho nội dung học.

## AC

- AC-015-01: chọn template/version → OAuth thành công → builder giữ đúng mẫu và chủ sở hữu.
- AC-015-02: đăng ký lỗi/hủy không mất lựa chọn, không redirect sang domain lạ.
- AC-016-01: draft/preview không public; publish lại không tạo tenant mới.
- AC-017-01: hai request tranh cùng slug chỉ một thành công; retry cùng key trả cùng job/tenant.
- AC-017-02: khi Active, homepage và admin đúng tenant; hostname lạ không route tới tenant mặc định.
- AC-017-03: tenant không được active khi provisioning thiếu bước cần thiết; job lỗi có thể xử lý lại.
