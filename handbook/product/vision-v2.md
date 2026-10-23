# YiEdu v0.2 — Tầm nhìn và hành trình sản phẩm

Ngày: 23/10/2026. Đây là phiên bản đặc tả, KHÔNG là phiên bản phần mềm đã triển khai.
Nguồn: yêu cầu trực tiếp của anh Tuân. Yêu cầu sản phẩm được ghi nhận; thiết kế kỹ thuật còn cần spike.
[Thay đổi CR-001](changes/CR-001-extensible-platform.md) giải thích tác động và thứ tự triển khai.

## Định vị

YiEdu là nền tảng tạo và vận hành hệ thống e-learning có thể mở rộng như mô hình CMS Joomla:
website công khai + trang quản trị, template, component, plugin, cập nhật core và chợ developer.
YiEdu dùng FastAPI/PostgreSQL; không chạy Joomla PHP và không hứa cài trực tiếp ZIP của Joomla.
Yisoft và Yirobot là tenant demo. Developer Handbook và học quản lý dự án tiếp tục là phần phạm vi.

## Hành trình khách hàng đã yêu cầu

1. Vào `yiedu.vn`, xem và chọn template.
2. Chuyển sang đăng ký bằng Google, Facebook hoặc email; giữ nguyên lựa chọn template qua bước xác thực.
3. Đăng ký thành công vào builder, chỉnh thương hiệu và giao diện; lưu nháp/xem trước.
4. Bấm tạo/xuất bản hệ thống: cấp subdomain như `yisoft.yiedu.vn` với homepage và `/administrator`.
5. Owner đăng nhập quản trị để tạo, sửa khóa học, bài giảng và lộ trình; quản lý học viên.
6. Học viên tạo tài khoản tại website tenant; đăng nhập app YiEdu iOS/Android và học đúng lộ trình.
7. Khi khách ưng ý, yêu cầu gói ZIP của chính tenant để tải về triển khai local hoặc server riêng.
8. Core nhận cập nhật/vá lỗi từ YiEdu theo chính sách; tenant thêm template/component/plugin.
9. Developer xây, nộp, bán template/component/plugin qua chợ YiEdu, có version và quyền sử dụng.

`yiedu.vn` và các hostname trong tài liệu là mục tiêu thiết kế; repo chưa xác minh sở hữu domain,
chưa tạo DNS, chứng chỉ, OAuth application hoặc app store listing.

## Mô hình vận hành

| Chế độ | Người vận hành | Cập nhật |
|---|---|---|
| Shared SaaS | YiEdu | Code chung, bật/tắt extension theo tenant, rollout nhóm |
| Managed dedicated (đường mở rộng) | YiEdu | Có instance/version riêng, không bắt buộc ở đợt đầu |
| Standalone ZIP | Khách hàng hoặc đơn vị được thuê | Updater tại instance, tự chọn lịch/quyền và có thể duyệt thủ công |

ZIP chứa homepage và trang quản trị hoạt động với runtime/backend/database; không phải chỉ HTML tĩnh.
Chạy local cần môi trường runtime (đề xuất Docker), không phải giải nén rồi mở một file HTML.
Không bắt core học tập phụ thuộc Control Plane sau khi tách. Dịch vụ AI, email, cập nhật và marketplace
cần mạng/credential riêng; offline không đồng nghĩa có đầy đủ tính năng mạng.

## Mốc giá trị và điều chưa chốt

Hoàn chỉnh toàn sản phẩm theo nhiều sprint: đường tạo tenant → học → export → update/extension → marketplace.
Không loại marketplace khỏi tầm nhìn, cũng không gán mọi năng lực vào một sprint.
Chưa chốt giá/gói/quota, phí nền tảng, chia doanh thu, deadline, SLA và kênh thanh toán.
Frontend Next.js/Puck và mobile React Native/Expo vẫn là đề xuất, không tự chuyển thành quyết định đã chốt.

## Đọc tiếp

[Journey chi tiết](onboarding-builder.md), [identity/mobile](identity-mobile.md),
[extension](extensions.md), [nâng cấp](updates.md), [marketplace](marketplace.md),
[ZIP độc lập](standalone-export.md), [truy vết](traceability-v2.md).
