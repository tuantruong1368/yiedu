# YiEdu 0.6 — template website và Content Studio

24/10/2026. [CR-004](changes/CR-004-content-studio.md), [cách chạy và SDK](../guides/content-studio.md).

| Phần | Hành vi đã có code |
|---|---|
| Trang chủ | Thông điệp tạo e-learning riêng, 4 bước, 14 website thu nhỏ từ document thật |
| Điều hướng | Menu và nút dùng ID → slug, link tương đối, anchor, course filter và auth giữ course |
| Content Studio | Thư viện riêng tenant, full-page lesson/slide/video/simulation editor, VI/EN |
| Bài giảng | Rich text/math/table/code/checklist; outline/find; chèn và sửa media snapshot; learner preview |
| Dự án | Tạo/sửa/xóa, revision conflict, nháp trình duyệt theo tài khoản, Ctrl/⌘ S |
| Slide/video | Storyboard, notes, play, JSON/HTML/PDF print, canvas video export, micro tùy chọn |
| Thí nghiệm | Differential drive, PID, bubble sort và Amdahl có thông số/giới hạn mô hình |
| Nội dung mẫu | Slide và bài theo cảnh ở 65 học phần; mô phỏng chọn đúng nhóm môn; VI/EN |
| Nâng cấp | Migration 0005; cập nhật bài nguyên bản 0.5 theo fingerprint; giữ bài sửa và tiến độ |
| Portable | ZIP schema 0005 chứa assets và media snapshots; đọc được snapshot cũ |

Yirobot và Yisoft vẫn là 32 môn/128 bài/8 học kỳ mỗi mẫu, với nội dung thực hành cô đọng.
Chưa phải toàn bộ giáo trình đại học và chưa có review chuyên gia cho nội dung.
"Video" mới bao gồm bài theo cảnh và file video do tác giả xuất từ canvas; chưa có kho video
người giảng quay sẵn hoặc AI dựng video. Server lưu storyboard, chưa lưu file video upload.
Giọng đọc máy khi playback phụ thuộc voice có sẵn và không nằm trong video export; bật micro
để thu lời giảng khi xuất. Tương tác media mới trên web; native vẫn fallback text/video.

Không thay dependency runtime/framework trong bản này. Giới hạn thương mại/production ở
[trạng thái](status.md) vẫn áp dụng. [Bằng chứng](verification.md) ghi cụ thể môi trường đã chạy;
không dùng PGlite local để kết luận PostgreSQL Docker đã qua khi CI chưa xác nhận.
