# Nhật ký quyết định

Ngày ghi nhận: 23/10/2026. Chỉ ghi “đã chốt” khi có phát biểu xác nhận của anh.

| ID | Nội dung | Trạng thái | Căn cứ / hệ quả |
|---|---|---|---|
| DEC-001 | Backend Python + FastAPI | Đã chốt | Anh xác nhận chọn FastAPI; API chung cho web/mobile |
| DEC-002 | Database PostgreSQL | Đã chốt | Anh xác nhận chọn PostgreSQL |
| DEC-003 | Học quản lý dự án song song xây sản phẩm | Đã chốt | Làm tuần tự, tài liệu và bài thực hành |
| DEC-004 | Khởi tạo repo mới, đưa bộ nền lên main | Đã chốt cho lần khởi tạo này | Yêu cầu trực tiếp; không mặc định cho các thay đổi sau |
| DEC-005 | Next.js + React + Puck | Đề xuất | Cần spike editor, SSR, SEO, lưu/xuất dữ liệu |
| DEC-006 | React Native + Expo | Đề xuất | Đánh giá video/offline/auth và build white-label |
| DEC-007 | Google Cloud, Cloud SQL, Cloud Storage | Đề xuất | Cần ngân sách, khu vực dữ liệu, PoC triển khai |
| DEC-008 | Shared database + tenant_id, RLS | Thiết kế đề xuất | Scaffold mới có lọc tenant ở course API; chưa có RLS |
| DEC-009 | SQLAlchemy + Alembic, PostgreSQL 17 local | Lựa chọn triển khai bộ nền | Có thể đổi qua ADR; không là yêu cầu khách hàng |

## Cách thêm quyết định

Mỗi mục ghi bối cảnh, phương án, lợi/hại, người quyết định, ngày, trạng thái và điều kiện xem xét lại.
Dùng [ADR](../forms/adr.md). Không biến đề xuất của AI thành yêu cầu đã duyệt.

Tham khảo chính thức: [FastAPI](https://fastapi.tiangolo.com/),
[PostgreSQL](https://www.postgresql.org/docs/), [Puck](https://puckeditor.com/docs).

## Quyết định và yêu cầu v0.2

| ID | Nội dung | Trạng thái | Căn cứ / hệ quả |
|---|---|---|---|
| DEC-010 | Template → Google/Facebook/email → builder → subdomain có homepage/admin | Yêu cầu đã xác nhận | Chỉ đạo anh Tuân 23/10/2026; FR-015–017 |
| DEC-011 | Tenant quản lý khóa học, bài giảng, lộ trình; learner đăng ký tại tenant, học trên app chung | Yêu cầu đã xác nhận | FR-018–019; kiểm membership và tiến độ |
| DEC-012 | ZIP chạy độc lập, cập nhật core từ YiEdu, thêm extension | Yêu cầu đã xác nhận | FR-020–022; runtime không phụ thuộc Control Plane để học |
| DEC-013 | Developer tạo và bán template/component/plugin | Yêu cầu đã xác nhận | FR-023–024; bổ sung marketplace vào phạm vi |
| DEC-014 | Giữ repository, thêm spec v0.2 và manifest contract thử nghiệm | Lựa chọn triển khai | Nền hiện tại dùng tiếp được, không có production cần phá bỏ |
| DEC-015 | Extension registry/host cô lập, signed updates, rollout theo cohort | Thiết kế đề xuất | Cần spike và ADR trước triển khai thực tế |
| DEC-016 | Identity toàn cục + membership; adapter để standalone | Thiết kế đề xuất | Firebase/Identity Platform hoặc provider khác chưa chốt |

Nguồn và giới hạn nghiên cứu ở [research](research.md). DEC-005/006/007 vẫn là đề xuất.
