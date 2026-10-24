# CR-003 — thư viện website và học liệu mẫu

Yêu cầu: nhân rộng Yirobot cho doanh nghiệp, trung tâm, giáo viên và các lộ trình đại học.
Người yêu cầu: chủ sản phẩm; chỉ định cập nhật trực tiếp main.

Triển khai 0.5: 14 website 5 trang VI/EN, preview bài học, sao chép nội dung độc lập khi
publish lần đầu. 65 chuyên đề gốc tạo 260 bài, hai bản đồ Robot/Software 32 môn/8 học kỳ.
Không nhập toàn văn sách bên thứ ba. Nội dung editorial-draft, cô đọng, cần review chuyên môn;
chưa đáp ứng yêu cầu bộ giáo trình đầy đủ cho bốn năm đại học.

Migration 0004 thêm preference/provenance/metadata; không thay thế dữ liệu tenant hiện hữu.
Không tự nâng nội dung sau khi khách sửa. Developer đọc [hướng dẫn](../../guides/template-library.md).

Tiêu chí kiểm chứng: site/lesson validator VI/EN, ví dụ Python chạy ra output đã ghi,
32 môn/128 bài/9 paths khi publish, republish giữ ID, learner ngoài tenant bị chặn,
preview 5 trang/32 thẻ môn và chuyển ngôn ngữ. Xem [verification](../verification.md).
