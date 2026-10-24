# Trạng thái thực tế YiEdu

Cập nhật bản 0.6.0: [Content Studio và template website](release-0.6.md).
Đã có Studio toàn màn hình, thư viện slide/video theo cảnh/mô phỏng riêng tenant, revision,
media snapshots và nâng cấp học liệu mẫu. [Hướng dẫn sử dụng và SDK](../guides/content-studio.md).
Các mục dưới giữ lịch sử triển khai và các phần chưa có; 0.6 không hoàn thành marketplace/AI/media storage.

Cập nhật: bản chạy local 0.5.0. [Template và học liệu 0.5](release-0.5.md). [Authoring/đa ngôn ngữ 0.4](release-0.4.md) mở rộng bản 0.3. [Ma trận chi tiết](release-0.3.md) là nguồn trạng thái triển khai hiện tại.

## Đã có code chạy

- FastAPI/PostgreSQL migration 0001–0002, tài khoản email/session và membership/roles.
- Next.js website/gallery, dashboard, Puck builder, publish tenant và public/admin/learn pages.
- Khóa học/bài học, ordered learning paths, enrollment/prerequisite/completion.
- Hai first-party extension (certificate/activity log), developer metadata submission.
- ZIP tenant/source/checksum, script verify và restore vào môi trường dữ liệu sạch.
- App Expo: login/instance/membership/course/path/lesson/video/progress; bundle iOS/Android.
- CI và Handbook P0–P9 đồng bộ; kết quả ở [verification](verification.md).

## Chưa hoàn thành

Google/Facebook và email recovery/verification; media upload/storage; quiz; AI; thanh toán;
RLS/composite tenant FK và production hardening; async jobs; signed updater; arbitrary third-party
extension execution; marketplace artifact/review/sales/ledger/payout; app signing/store/device UAT;
cloud/DNS/TLS và release production. Không có hệ thống public tại yiedu.vn được tạo bởi cập nhật này.

## Mốc quản lý

P0–P4 có đặc tả v0.2 và các quyết định triển khai 0.3; discovery/pilot thực tế chưa thực hiện.
P5 có lát cắt local thực thi; P6 có automated tests/build; P7–P9 chưa nghiệm thu hoặc production.
Không đóng toàn bộ FR/issue chỉ vì một phần đã có code.

FastAPI/PostgreSQL là quyết định đã chốt. Next.js/Puck và Expo được dùng trong bản triển khai này
để thực hiện yêu cầu tạo sản phẩm, vẫn cần review kiến trúc trước production.
[Start here](../start-here.md) giữ lộ trình học; [product local](../guides/product-local.md) để chạy thử.

## Nâng cấp nền tảng 24/10/2026

Python 3.15.1, Node.js 26.12.1, PostgreSQL 18.6, FastAPI 0.162.0, Next.js 16.4.3.
React mobile giữ 19.3.0 theo Expo 58; web dùng 19.3.1. Không thay đổi phạm vi tính năng.
[Hướng dẫn nâng cấp](../guides/upgrade-latest.md) có backup/restore PostgreSQL 17 và kiểm tra dữ liệu.

## Authoring và đa ngôn ngữ 0.4

VI/EN, GrapesJS builder đa trang/menu/logo/events, template auth routing, white-label tenant,
Tiptap rich lesson/math/simulation và registry developer.
[CR-002](changes/CR-002-authoring-i18n.md), [SDK và cách chạy](../guides/authoring-sdk.md).
Chưa có marketplace thanh toán/cài arbitrary code, AI provider hoặc rich custom node native.
