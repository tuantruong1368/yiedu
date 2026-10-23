# Trạng thái thực tế YiEdu

Cập nhật: 23/10/2026. Bộ khởi tạo repository mới.

## Đã quyết định

FastAPI, PostgreSQL; vừa làm sản phẩm vừa học quản lý dự án; đưa bộ nền lên main theo yêu cầu.

## Có trong bộ nền

- Handbook tiếng Việt P0–P9, hồ sơ sản phẩm, biểu mẫu và hướng dẫn thực hành.
- API admin tạo/list tenant và course metadata; health; OpenAPI.
- Migration PostgreSQL, Compose, unit/integration tests và GitHub Actions.
- Báo cáo kiểm tra thực tế ở [verification](verification.md).

## Chưa có

UI Next.js/Puck; app mobile; auth học viên/membership; RLS; bài học/tiến độ/bài kiểm tra;
thanh toán; AI; export/restore độc lập; triển khai cloud; khách hàng pilot; nghiệm thu thương mại.
Danh sách đầy đủ và phụ thuộc ở [backlog](backlog.md).

## Mốc quản lý

| Giai đoạn | Tài liệu | Hoạt động thực tế |
|---|---|---|
| P0 | Bản nền có sẵn | Anh cần đọc/review charter và giả định |
| P1 | Kịch bản discovery có sẵn | Chưa phỏng vấn |
| P2 | Backlog/kế hoạch đề xuất | Chưa chốt lịch/ngân sách/phạm vi release |
| P3 | SRS mục tiêu có sẵn | Chưa baseline toàn bộ với khách hàng |
| P4 | Kiến trúc đề xuất + schema scaffold | Chưa chốt frontend/mobile/cloud |
| P5 | Scaffold đã viết | Chưa phát triển toàn sản phẩm |
| P6 | Test scaffold có sẵn | Xem báo cáo thực tế, không suy diễn pass |
| P7 | UAT kịch bản có sẵn | Chưa nghiệm thu |
| P8 | Checklist phát hành có sẵn | Chưa deploy staging/production |
| P9 | Runbook có sẵn | Chưa có vận hành người dùng thật |

## Việc anh làm đầu tiên

Đọc [start here](../start-here.md), chạy local, ghi learning notes, review P0 trước khi đi discovery.
Không cần học hết framework mới được đọc tài liệu quản lý dự án.

## Cập nhật đặc tả v0.2

[Vision](vision-v2.md) và [CR-001](changes/CR-001-extensible-platform.md) đã được soạn theo yêu cầu mới.
Không cần xóa repository. Thêm đặc tả onboarding/subdomain, identity/mobile, extension/SDK,
updater, marketplace, ZIP và truy vết P0–P9. Có manifest schema/examples và validator offline thử nghiệm.

Không có UI/onboarding/OAuth/DNS/app/installer/updater/marketplace hoạt động từ cập nhật tài liệu này.
Không sửa schema/migration 0001. Các bảng ở data model v0.2 là thiết kế, chưa tạo thật.
FastAPI/PostgreSQL đã chốt; Next.js/Puck, React Native/Expo, identity provider và cloud vẫn là đề xuất.
Kết quả kiểm tra bản v0.2 được bổ sung ở [verification](verification.md).
