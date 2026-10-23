# CR-001 — Nền tảng e-learning có extension và marketplace

Ngày 23/10/2026. Người yêu cầu/quyết định hướng sản phẩm: anh Trương Châu Tuân.
Trạng thái: đã ghi nhận yêu cầu và cập nhật đặc tả v0.2 theo chỉ đạo; chưa nghiệm thu chức năng.

## Thay đổi

Bổ sung hành trình template → đăng ký Google/Facebook/email → builder → cấp subdomain;
admin tenant quản lý khóa học/bài giảng/lộ trình; học viên đăng ký tại tenant rồi dùng app chung;
ZIP độc lập có core updater; cài extension và developer marketplace bán template/component/plugin.

## Ảnh hưởng

| Mặt | Ảnh hưởng / việc cần làm |
|---|---|
| Yêu cầu | Giữ FR-001–014; thêm FR-015–025 và AC, đồng bộ UAT/backlog |
| Kiến trúc | Thêm Draft Workspace, provisioning, domain router, release registry, marketplace |
| Identity | OAuth callback tin cậy, membership theo tenant; mobile chọn đúng tenant/instance |
| Dữ liệu | Thêm domain, workspace/page revision, learning path, package/version/entitlement/job |
| Runtime | Tách cấu hình/data khách khỏi core; extension API có version, không sửa core trực tiếp |
| Export | ZIP ứng dụng/data/media + manifest; đổi identity/provider và endpoint sau chuyển server |
| Vận hành | Release có chữ ký, tương thích, migration, staged rollout và recovery |
| Kinh doanh | Seller, phí, quyền dùng/export, hoàn tiền/payout cần quyết định sau |
| Nguồn lực | Tăng đáng kể phạm vi; cần spike và ước lượng lại, không tự cam kết lịch |

## Quyết định repository

Giữ repo và lịch sử hiện tại. Bộ nền FastAPI/PostgreSQL chưa có dữ liệu production;
không cần xóa repository. Không đổi migration 0001 để mô tả tính năng chưa viết.
Chỉ thêm migration khi triển khai bảng thật; kiến trúc mục tiêu được mô tả riêng.

## Đầu ra lần cập nhật này

Đặc tả liên kết P0–P9, nghiên cứu chính thức, mô hình domain/API mục tiêu, backlog và test/UAT.
Thêm hợp đồng manifest thử nghiệm và validator offline; KHÔNG thêm installer hay chạy code plugin.
Cập nhật này không tạo DNS/cloud, không đăng ký OAuth, không xuất bản app hoặc mở thanh toán.

## Điều kiện triển khai tiếp

Chọn story từ backlog → spike/ADR → AC → code/migration → test/review → nghiệm thu từng lát cắt.
Yêu cầu sản phẩm đã được anh nêu; phương án kỹ thuật v0.2 là đề xuất cần kiểm chứng.
