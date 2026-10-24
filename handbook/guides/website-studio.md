# Website Studio 0.7 và quản trị bài học

Ngày 24/10/2026. Cập nhật [trải nghiệm 0.8](experience-yoga.md) cho template, Yoga và Back/Studio.  [Phạm vi](../product/release-0.7.md), [yêu cầu và nghiệm thu](../product/changes/CR-005-authoring-workspaces.md).

## Cập nhật local

Mở Docker Desktop, vào thư mục YiEdu:

```bash
git switch main
git pull --ff-only origin main
docker compose up --build -d
docker compose ps -a
```

Giữ `.env` và database hiện tại. Bản này không thêm migration, không thay khóa học, bài học hoặc
website đã lưu. `migrate` cần Exited (0), API/web cần Up. Nếu trình duyệt còn giao diện cũ,
tải lại bằng Cmd+Shift+R trên Mac. [Sao lưu và khôi phục](upgrade-latest.md).

## Website không mất nội dung khi điều hướng

Website đã xuất bản tải document riêng từ `GET /api/v1/sites/<slug>/render?page=<page-slug>&locale=vi`.
Server trả HTML/CSS, danh sách khóa học đã xuất bản, liên kết page ID → slug và runtime sự kiện
trong một response. Không còn phụ thuộc việc khôi phục chuỗi `srcDoc` sau chuyển trang client.
Các trang HTML dùng `Cache-Control: no-store` để lần mở mới đọc dữ liệu hiện hành.

Iframe giữ sandbox/CSP, xác nhận ready/height với parent, giới hạn kích thước, có retry và nút
tải lại nếu không tải được nội dung. CSS dùng đơn vị vh được giữ trong viewport có cuộn để tránh
vòng lặp chiều cao. Nội dung absolute được tính khi đo chiều cao trang.
Puck legacy vẫn dùng renderer cũ; không tự chuyển hoặc ghi đè nội dung của khách.

## Bố cục Website Studio

| Khu vực | Thao tác |
|---|---|
| Thanh trên | Đổi tên, undo/redo, xem trước nháp, tập trung, lưu và xuất bản |
| Thanh canvas | Trang, ngôn ngữ nội dung, Desktop/Tablet/Mobile, zoom, Vừa khung, import HTML/CSS |
| Trái | Thư viện 23 gadget/bố cục có minh họa SVG, tìm kiếm, lọc nhóm, yêu thích; trang/menu/logo; lớp; bảng màu |
| Giữa | Canvas chỉnh trực tiếp, kích thước viewport/zoom, đường biên và breadcrumb lựa chọn |
| Phải | Thuộc tính phần tử, vị trí, nhân bản/xóa/thêm con, style, media URL và sự kiện |

Kéo thumbnail vào vị trí trong canvas hoặc nhấn **+** của gadget để thêm cạnh/trong phần tử đang chọn.
Các section lớn được thêm ở cấp bố cục trang để tránh vô tình lồng cả website vào một đoạn text.
Kéo nội dung đã có và resize tiếp tục dùng GrapesJS. Mặc định dùng flow responsive; chọn
Absolute/Fixed khi cần đặt tọa độ. Kiểm tra cả Desktop/Tablet/Mobile trước xuất bản.

Có 15 gadget cơ bản và 8 section: Hero hai cột, Hero tập trung, lưới lợi ích, số liệu,
CTA, so sánh chương trình, giảng viên và gallery. Nội dung là mẫu để tác giả thay bằng thông tin thật.
Hình minh họa thư viện là SVG được vẽ bằng code, không phải ảnh website khách đã chỉnh sửa.

**Xem trước** mở bản nháp toàn màn hình và chuyển giữa các trang; chưa publish. **Giao diện**
cung cấp sáu bảng màu hoặc màu tự chọn, cập nhật accent trên các trang. Ctrl/⌘ S lưu nháp.
Có thông báo chưa lưu, cảnh báo rời editor và khôi phục bản nháp trình duyệt theo workspace/user.
Bản nháp trình duyệt và mục yêu thích không thay thế sao lưu hoặc đồng bộ đa thiết bị.

CSS dùng `grapesjs-parser-postcss` 1.0.3 (stable mới nhất tại lần kiểm tra), tránh mất biến màu
trong shorthand `background: var(...)`; export giữ cả rule chưa được dùng để không làm mất style
giữa các trang. Bộ kiểm tra server nh3/tinycss2 vẫn áp dụng khi lưu/xuất bản.
Nguồn: [GrapesJS custom CSS parser](https://grapesjs.com/docs/guides/Custom-CSS-parser.html),
[plugin chính thức](https://github.com/GrapesJS/parser-postcss).

## Quản trị khóa học và bài học

Vào quản trị → **Khóa học**. Desktop có ba vùng cuộn riêng:

1. Tìm/chọn khóa học. **Tạo khóa học** mở hộp thiết lập, biểu tượng bút sửa thiết lập khóa đang chọn.
2. Tìm/chọn bài học hoặc **Thêm bài học**. Chọn bài nào thì editor mở ngay ở vùng bên cạnh.
3. Soạn nội dung, công thức, bảng, ảnh/video; **Lưu bài học** luôn ở đầu vùng biên tập.

Editor không còn ở dưới toàn bộ danh sách khóa học. Trên màn hình nhỏ, danh sách khóa học thành
dải cuộn ngang, danh sách bài được giới hạn chiều cao. Thanh lưu của editor giữ gần phần đang sửa.

**Mở Studio toàn màn hình** lưu bài hiện tại rồi mở editor nâng cao. Khi trở lại Quản trị,
hệ thống giữ đúng khóa và bài đang sửa qua URL `?tab=courses&course=<id>&lesson=<id>`.
Chuyển bài nhanh có hủy kết quả tải cũ, tránh mở nhầm bài khi request về không đúng thứ tự.
Sửa bài giữ revision check; lỗi xung đột không ghi đè dữ liệu của người khác.
Đổi bài/khóa/tab có cảnh báo nếu còn thay đổi chưa lưu.

[Content Studio nâng cao và học liệu](content-studio.md). AI, media storage và marketplace không
được triển khai thêm trong đợt sửa giao diện này; các giới hạn đã công bố tiếp tục áp dụng.

## Điểm mở rộng cho developer

| File | Trách nhiệm |
|---|---|
| `backend/yiedu/site_render.py` | Render document public, rewrite liên kết, inject khóa học, CSP/runtime |
| `web/components/authoring/site-runtime.tsx` | Vòng đời iframe, handshake, retry và bridge có kiểm source |
| `web/lib/authoring/gadgets.ts` | Catalog/registry, nội dung mẫu, khởi tạo gadget |
| `web/components/authoring/gadget-preview.tsx` | Vector preview của các kiểu bố cục |
| `web/components/authoring/gadget-library.tsx` | Lọc/tìm/yêu thích, kéo thả qua tọa độ iframe đã scale, chèn model |
| `web/components/builder.tsx` | GrapesJS/PostCSS, pages/menu/logo/theme, selection, save/publish |
| `web/components/course-workspace.tsx` | Khóa học/bài học/editor, dialog khóa, request cancellation và context |

Gadget mới vẫn đăng ký qua SDK, không tải/chạy JavaScript bất kỳ từ tenant. Kéo từ thư viện
dùng tọa độ viewport iframe sau scale để điểm thả đúng ở các mức zoom; drag/resize phần tử
trên canvas vẫn do GrapesJS xử lý. Không gọi API nội bộ `_` của GrapesJS để chèn model.
