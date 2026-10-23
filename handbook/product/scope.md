# P0.3 — Phạm vi và ranh giới

## Tổng thể sản phẩm

Control Plane quản lý khách hàng, thuê bao, vòng đời tenant và xuất hệ thống.
LMS Runtime quản lý thương hiệu, trang, thành viên, khóa học và hoạt động học.
Runtime phải có đường chạy độc lập; không buộc gọi Control Plane để đọc bài học sau khi tách.

## Đợt khởi tạo hiện tại

Đã chuẩn bị trong repo: tài liệu P0–P9, API admin tạo/list tenant/course, migration,
health check, test và CI. Chưa có màn hình website/app cho người dùng.

## Các lát cắt dự kiến tiếp theo

1. Đăng nhập và phân quyền tenant, chống truy cập chéo.
2. Branding và homepage, quyết định editor sau spike Puck.
3. Khóa học, bài học, ghi danh, tiến độ và bài kiểm tra.
4. Web public Việt/Anh, SEO; app mobile dùng chung.
5. Thanh toán/thuê bao, AI, app riêng và xuất độc lập theo kế hoạch được duyệt.

Đây là phân rã để học và triển khai, không phải tuyên bố giảm phạm vi toàn sản phẩm.

## Chưa thuộc cam kết hiện tại

Marketplace bán khóa học của YiEdu, tự động duyệt App Store, video DRM tuyệt đối,
và export mọi thành phần của dịch vụ Google thành phần mềm tự host.
Nếu cần, mở change request và đánh giá ảnh hưởng trước.

## Quản lý thay đổi

Ghi vấn đề → yêu cầu/AC → tác động chi phí, thời gian, dữ liệu và bảo mật → quyết định của chủ
sản phẩm → sửa backlog/spec → triển khai → kiểm tra. Dùng [biểu mẫu](../forms/change-request.md).

## Baseline sản phẩm v0.2

Bổ sung chính thức vào phạm vi: [onboarding/builder/subdomain](onboarding-builder.md),
[identity và app chung](identity-mobile.md), [extension/SDK](extensions.md),
[core updater](updates.md), [developer marketplace](marketplace.md).
Marketplace ở đây bán template/component/plugin; khác với marketplace bán khóa học của YiEdu.
Joomla là tham chiếu mô hình CMS, không yêu cầu tương thích mã PHP/ZIP của Joomla.
App riêng/managed dedicated là hướng bổ sung; app chung và ZIP độc lập là yêu cầu trực tiếp.
