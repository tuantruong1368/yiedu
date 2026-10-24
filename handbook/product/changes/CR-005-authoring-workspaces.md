# CR-005 — hiển thị website, Website Studio và bố cục bài học

Anh Tuân yêu cầu: sửa website mất nội dung khi điều hướng/quay lại từ quản trị; builder có hình
minh họa gadget, màu và bố cục chuyên nghiệp; thêm/sửa bài học không nằm cuối danh sách khóa học.

| AC | Hành vi nghiệm thu | Kiểm tra |
|---|---|---|
| AC-005-01 | Website giữ nội dung/CSS qua menu, quản trị, quay lại, Back/Forward, VI/EN | `render-regression.spec.ts` |
| AC-005-02 | Document public giữ CSP/no-store, chỉ hiện course published, 404/422 đúng | `test_site_render.py`, integration published render |
| AC-005-03 | Catalog 23 gadget có SVG, tìm/lọc; thêm bằng nút và kéo chuột vào canvas | `builder-workspace.spec.ts` |
| AC-005-04 | Theme hiển thị đúng trong canvas, sau lưu/mở lại và website đã publish | browser kiểm computed background color, PostCSS |
| AC-005-05 | Preview nháp, layout ba panel, responsive device/zoom và style không mất | builder/authoring browser, ảnh kiểm tra |
| AC-005-06 | 30 course/25 lesson không đẩy editor xuống dưới; mở/sửa/lưu ngay cạnh danh sách | browser long-course workspace |
| AC-005-07 | Mở Studio lưu nội dung; quay lại giữ khóa/bài; quyền và revision không đổi | browser workspace + các integration sẵn có |

Không thêm schema DB hoặc tự cập nhật nội dung tenant. Giữ Puck legacy, API membership/session,
validator website và rich lesson. [Cách dùng và SDK](../../guides/website-studio.md).
