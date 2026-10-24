# YiEdu 0.8 — khám phá template, Yoga và điều hướng

Ngày 24/10/2026. [CR-006](changes/CR-006-discovery-yoga-navigation.md),
[hướng dẫn dùng và mở rộng](../guides/experience-yoga.md), [bằng chứng](verification.md).

- 15 mẫu/7 nhóm, tìm có/không dấu, kết quả/empty state, URL giữ nhóm/từ khóa, card hover/focus
  nhẹ và các section phân vùng màu. Bỏ class card thừa ở nút chọn mẫu.
- Preview dùng menu/brand chung website thật, full 5 trang, native render/CSP, viewport và Back hợp lý.
- An Nhiên Yoga: 4 chuyên đề, 16 bài nhập môn Việt/Anh và 6 video ngoài có nguồn; nhật ký,
  chọn mức/điểm tựa, tự đánh giá. Copy riêng tenant, learner ghi danh/đọc/xem/hoàn thành được.
- Một logo admin, Content Studio nhúng panel phải; nút tạo có tên riêng, lọc dự án/bài tách biệt.
- Return URL cùng tenant giữ filter/course/lesson; tab, Back/Forward và learner URL nhất quán;
  lưu project mới giữ editor. Có kiểm nested tool quay về project trước.
- Bỏ iframe mount hai lần và hard reload nội bộ; font hệ thống, scrollbar/skeleton ổn định,
  player theo yêu cầu, trạng thái lỗi/404 có lối đi tiếp, tôn trọng giảm chuyển động.
- Docker đóng gói public SVG; ZIP gồm SVG/source mobile. Mobile mở video nguồn từ rich lesson.

Không thêm dependency hoặc migration. Giữ Python/Node/PostgreSQL/framework đã chốt, schema 0005,
Puck legacy, validators, ACL, revision và dữ liệu đã lưu. Tenant cũ không tự nhận khóa học Yoga;
tạo mẫu mới để thử. Đây không phải triển khai production.

Video cần Internet, phụ đề/embedding do bên cung cấp quyết định; không phân phối lại file video.
Giáo trình Yoga chưa được chuyên gia nghiệm thu, không phải trị liệu hoặc chứng chỉ giảng viên.
Chưa benchmark mọi thiết bị/mạng hoặc UAT mobile thật. AI/billing/upload/quiz/marketplace và
các giới hạn khác tại [status](status.md) vẫn áp dụng.
