# P0.1 — Đề cương khởi tạo YiEdu

Trạng thái: bản nền để chủ sản phẩm review. Ngày soạn: 23/10/2026.
Chủ sản phẩm: anh Trương Châu Tuân. Người soạn: trợ lý AI, không thay người chịu trách nhiệm.

## Vấn đề và cơ hội

Giả thuyết: giảng viên, trung tâm và doanh nghiệp cần hệ thống đào tạo có thương hiệu riêng,
nhưng việc tự phát triển và vận hành tốn nguồn lực. Cần phỏng vấn trước khi khẳng định mức độ nhu cầu.

YiEdu cho khách hàng tạo hệ thống e-learning, nhập thương hiệu, thiết kế trang chủ, tạo khóa học,
mời học viên và học trên web/mobile. Khách hàng có thể dùng SaaS hoặc yêu cầu bản độc lập.
Website YiEdu tập trung giới thiệu, marketing, bán hàng và quản lý dịch vụ.
Yisoft/Yirobot là demo khách hàng. Có Developer Handbook và khu học quản lý dự án;
đối tượng truy cập và cách đóng gói khu học này cần discovery thêm.

## Ba mục tiêu

1. Sản phẩm: tạo và vận hành được hệ thống e-learning riêng từ một nền tảng chung.
2. Kinh doanh: kiểm chứng nhu cầu và khả năng trả tiền; chưa có chỉ tiêu doanh thu được duyệt.
3. Năng lực: thực hành quản lý dự án, thiết kế, phát triển, kiểm thử và vận hành sản phẩm.

## Phạm vi tổng thể

- Quản trị nền tảng, tenant, tài khoản và thành viên.
- Branding, thiết kế trang, khóa học, nội dung, bài kiểm tra, ghi danh và tiến độ.
- Gói thuê bao, đơn hàng, tích hợp thanh toán, quản lý quyền sử dụng.
- App học tập dùng chung trước; khả năng app thương hiệu riêng cần quy trình build/phát hành.
- AI hỗ trợ và xuất dữ liệu/code/media/cấu hình triển khai theo phạm vi hợp đồng.
- Handbook và thực hành quản lý dự án gắn với YiEdu.

## Ranh giới và nguyên tắc

Không xem bản demo là thành phẩm. Không cam kết deadline, ngân sách hoặc doanh số khi chưa
ước lượng và xác nhận. Không tự động xem AI là người phê duyệt. Không ghi hoàn thành giả.
Chiến lược bàn giao toàn sản phẩm sẽ được chia theo sprint, không ngầm cắt bỏ các năng lực tổng thể.
Mỗi đợt phát hành cần phạm vi riêng được review, không mặc định mọi tính năng vào lần chạy đầu.

## Điều kiện thành công dự kiến

| Nhóm | Cách đo | Trạng thái |
|---|---|---|
| Tạo hệ thống | Người dùng thử hoàn thành luồng tenant → branding → khóa học → học thử | Kịch bản đã xác định, chưa chạy UAT |
| Cô lập khách hàng | Các kiểm thử truy cập chéo tenant đều bị từ chối | Bắt buộc trước public, chưa đạt |
| Triển khai độc lập | Diễn tập phục hồi tenant đã xuất trên môi trường sạch | Chưa triển khai |
| Thương mại | Có phản hồi trả tiền và thanh toán đối soát được | Cần discovery và pilot |
| Học tập | Anh giải thích được quyết định và tự thực hiện từng bài | Chưa đánh giá |

## Quyền quyết định

Anh Tuân quyết định sản phẩm, ngân sách, chấp nhận rủi ro và phát hành. AI hỗ trợ soạn thảo,
triển khai và kiểm tra; mọi xác nhận phải ghi rõ chủ thể và bằng chứng.

Qua bước khi: anh review mô tả, chỉ ra nhóm khách hàng ưu tiên sơ bộ và ghi các điểm chưa quyết định.
Liên quan: [Stakeholder/RACI](stakeholders.md), [phạm vi](scope.md), [rủi ro](risks.md).

## Bổ sung v0.2 — yêu cầu chủ sản phẩm

[Vision v0.2](vision-v2.md) là mô tả chi tiết hiện tại: template gallery trước đăng ký,
Google/Facebook/email, builder trước publish, subdomain có homepage/admin, tạo bài giảng/khóa học/lộ trình,
app YiEdu chung, ZIP chạy local/server, core updater và marketplace extension do developer bán.
Các năng lực này thuộc phạm vi tổng thể; lịch/giá/ngân sách chưa chốt. Tiếp tục học P0–P9 song song.
[CR-001](changes/CR-001-extensible-platform.md) ghi tác động, không cần khởi tạo lại repository.
