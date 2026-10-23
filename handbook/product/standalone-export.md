# Đặc tả xuất hệ thống độc lập — bản đề xuất

Trạng thái: thiết kế cho FR-011, chưa triển khai. Mục tiêu là xuất đúng phạm vi khách hàng,
khôi phục được trên môi trường sạch và ghi rõ dịch vụ nào cần thay thế.

## Nội dung gói xuất dự kiến

- Runtime source/build theo quyền cấp phép, migration và phiên bản schema.
- Dữ liệu tenant đã lọc và quan hệ cần thiết; báo cáo số lượng và kiểm toàn vẹn.
- Media được phép xuất, checksum và đường dẫn ánh xạ.
- Page revisions, schema version, cấu hình branding và component renderer phù hợp.
- Cấu hình mẫu không có secret; deployment manifest và hướng dẫn restore.
- Nếu mua app riêng: source/cấu hình thương hiệu và quy trình build/ký, không hứa tự duyệt store.

Control Plane, dữ liệu khách hàng khác, khóa thanh toán/AI dùng chung và secret SaaS không nằm trong gói.
Identity cần chính sách chuyển tài khoản: liên kết danh tính hoặc reset/di chuyển theo provider;
không hứa copy password nguyên trạng giữa mọi dịch vụ.

## Luồng job

Kiểm quyền và phạm vi → tạo snapshot nhất quán → export dữ liệu/media → lập manifest/checksum →
kiểm số lượng và quan hệ → mã hóa/lưu an toàn → giao bằng quyền có thời hạn → restore drill → nghiệm thu.
Job có trạng thái, retry/idempotency, quota và audit; link tải không công khai vô thời hạn.
Chốt cách xử lý dữ liệu phát sinh trong lúc export (maintenance window hoặc snapshot/cutover).

## Manifest tối thiểu

Tenant ID, export ID, created_at, runtime/schema/component versions, danh sách file/checksum,
số bản ghi từng bảng, dịch vụ phụ thuộc, hướng dẫn cấu hình và giới hạn đã biết.
Không lưu secret vào manifest hoặc log.

## Tiêu chí nghiệm thu

Restore vào PostgreSQL sạch, file khớp checksum, người dùng đủ quyền đăng nhập và học,
branding/page render đúng, không có dữ liệu tenant khác và không cần Control Plane cho luồng học.
Kiểm upgrade/backup cho bản độc lập và trách nhiệm hỗ trợ sau giao.
Cloud service adapters phải có cấu hình hợp lệ ở môi trường đích; export source không tự thay thế dịch vụ cloud.
