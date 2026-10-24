# YiEdu 0.7 — Website Studio và quản trị bài học

Ngày 24/10/2026. [CR-005](changes/CR-005-authoring-workspaces.md), [hướng dẫn](../guides/website-studio.md).

- Website schema 2.0 dùng document URL từ server; CSP/sandbox, ready/height/retry, nội dung absolute
  và viewport CSS. Luồng đi về quản trị/website và lịch sử trình duyệt có regression test.
- Builder ba panel: library có 23 thumbnail SVG/search/filter/favorites; viewport/zoom/fit,
  live draft preview, theme, breadcrumb và property/style/event inspector.
- PostCSS parser giữ CSS variables/shorthand và rule chưa dùng, có kiểm màu thực tế sau lưu/mở lại/publish.
- Kéo gadget theo tọa độ iframe đã scale; chèn nút +; drag/resize phần tử vẫn dùng GrapesJS.
- Course workspace ba vùng cuộn riêng, tạo/sửa khóa qua dialog, lesson editor luôn cạnh danh sách,
  tìm bài, cảnh báo chưa lưu và quay lại đúng khóa/bài từ Content Studio.
- Video export gắn canvas trong DOM, yêu cầu frame khi ghi và báo lỗi nếu không nhận được dữ liệu,
  tránh tải xuống tệp video rỗng.

Không thêm migration; không xóa/ghi đè nội dung khách. Runtime/framework giữ phiên bản đã chốt;
bổ sung dependency chính thức `grapesjs-parser-postcss` 1.0.3. Mobile không đổi tính năng.
Builder đầy đủ phù hợp màn hình desktop; trên điện thoại có thể cần cuộn ngang vùng công cụ.
Những CSS đã mất trước đây không tự suy diễn và ghi đè theo template; tác giả có thể chỉnh lại style.

Các giới hạn AI, thanh toán, upload/media storage, marketplace, giáo trình và native interactive
ở [trạng thái](status.md) vẫn áp dụng. [Bằng chứng](verification.md) phân biệt local với native CI.
