# Content Studio 0.6 — hướng dẫn sử dụng và SDK

Ngày 24/10/2026. [Phạm vi và giới hạn](../product/release-0.6.md).
Đây là khu vực tạo học liệu toàn màn hình, tách khỏi page builder thiết kế website.

## Cập nhật local, giữ dữ liệu

Nếu database đã là PostgreSQL 18, mở Docker Desktop, vào thư mục repo rồi chạy:

```bash
git switch main
git pull --ff-only origin main
mkdir -p backups
umask 077
docker compose exec -T db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "backups/before-studio-$(date +%Y%m%d-%H%M%S).dump" &&
docker compose up --build -d
docker compose ps -a
```

Migration `0005` tạo `studio_assets`, thêm `lessons.revision`; không xóa bảng/nội dung cũ.
`migrate` cần `Exited (0)`; API/web cần `Up`. Giữ `.env` và không dùng `down -v`.
Nếu database còn 17, theo [hướng dẫn chuyển database](upgrade-latest.md) trước.
Nếu migration lỗi, đọc `docker compose logs --tail=100 migrate`; dừng trước khi thử lại.

## Kiểm tra website và chọn template

Trang chủ giải thích rõ hành trình tạo e-learning mang thương hiệu riêng.
Mỗi ảnh mẫu là iframe chỉ đọc từ chính `SiteDocument` hiện hành, có menu và nội dung mẫu,
không phải hình minh họa khác với website sắp tạo. Nhấn ảnh để mở website 5 trang và đọc bài.
Đây là bản render thu nhỏ, không phải ảnh chụp riêng của mọi tùy chỉnh tenant sau này.

Menu và nút `data-template-link` dùng bảng ánh xạ page ID → slug. Đổi slug ở builder vẫn giữ liên kết.
Các liên kết tương đối như `about.html`, `home`, `/p/roadmap` được ánh xạ tới trang đã có.
Không tự tạo trang thiếu hoặc backend cho HTML được nhập từ website khác.
Menu tenant vẫn hiện dạng cuộn ngang trên màn hình nhỏ. Nút học dẫn vào khu học tập;
người đang đăng nhập được tham gia tenant, người chưa đăng nhập có lựa chọn đăng nhập/đăng ký.

## Studio và bài giảng toàn màn hình

Vào `/t/<slug>/administrator` → **Studio nội dung**; hoặc mở
`/t/<slug>/administrator/studio` trực tiếp. Owner, admin và instructor được dùng.

- **Bài giảng nâng cao:** chọn khóa học, đặt tiêu đề/thứ tự, biên tập VI/EN; định dạng,
  heading, danh sách, bảng, checklist, code, công thức, ảnh và YouTube.
- Cột trái có thiết lập, mục lục heading và tìm trong bài; cột phải là thư viện học liệu.
- Nhấn dự án để chèn snapshot vào đúng vị trí con trỏ. Nút **Sửa học liệu** chỉnh bản sao tại chỗ;
  **Remove tool** xóa khối, không xóa dự án thư viện. Undo/redo có trong toolbar.
- **Xem như học viên** dùng cùng renderer với khu học tập; **Tập trung** thu các panel.
- **Lưu** hoặc Ctrl/⌘ S lưu vào database; báo lỗi xung đột nếu bản khác đã sửa cùng revision.
  Không tự ghi đè khi nhận lỗi 409. Tải lại và đối chiếu trước khi lưu bản nháp của mình.
- Bản nháp trình duyệt được giữ theo user/tenant/project; có nút khôi phục hoặc bỏ.
  Bản nháp này không thay thế sao lưu trên server và không đồng bộ sang thiết bị khác.
- Từ form bài học gọn, **Lưu và mở Studio toàn màn hình** lưu nội dung hiện tại trước khi mở.

## Ba thư viện độc lập

| Module | Biên tập | Học và xuất |
|---|---|---|
| Slide | Thêm/xóa/nhân bản/sắp thứ tự; tiêu đề, nội dung, ghi chú, màu và thời lượng | Trước/sau, tự phát, bàn phím trái/phải, ghi chú; JSON, HTML, in PDF |
| Video | Storyboard cảnh, kịch bản, thời lượng, lời giảng; URL HTTPS tùy chọn | Phát theo cảnh; đọc lời giảng từ trình duyệt; xuất WebM/MP4 theo codec hỗ trợ; thu micro nếu người dùng bật |
| Mô phỏng | Chọn robot hai bánh, PID, bubble sort hoặc Amdahl; đặt tham số đầu | Điều chỉnh, xem quỹ đạo/đáp ứng, chạy thuật toán từng bước; JSON |

Xuất video chạy theo thời gian thật từ canvas 1280×720. File tải về máy, không tự upload video
lên storage của server. Bật micro khi muốn thu lời giảng thật; lời đọc `speechSynthesis` chỉ dành
cho playback, không được trộn vào video xuất. Micro cần quyền trình duyệt và HTTPS hoặc localhost.
Có thể hủy xuất; track micro dừng sau khi xong/hủy. HTML/PDF là bản trình bày tĩnh.
Video URL có sẵn được phát riêng; chức năng xuất tạo video từ storyboard, không tải/chuyển mã URL đó.

Các mô phỏng là mô hình giáo dục có giả định và đơn vị, không phải trình mô phỏng robot 3D,
compiler chạy code học viên hoặc kết quả đánh giá robot thật. Không chạy JavaScript tùy ý từ tenant.

## Yirobot và Yisoft

Hai template vẫn có 32 học phần, 128 bài và 8 học kỳ mỗi mẫu. Mỗi học phần thêm slide ôn nguyên lý,
bài giảng theo cảnh có ghi chú và hoạt động kiểm chứng. Những môn phù hợp có thí nghiệm điều khiển,
robot, thuật toán hoặc hiệu năng; không gắn mô hình không liên quan vào mọi môn.
Học liệu Việt/Anh gồm giải thích, ví dụ/code, bài thực hành, câu hỏi và đáp án tham khảo.

Tenant mới chọn **Dùng bài mẫu** nhận luôn thư viện dự án và bài học. Tenant đã có dữ liệu:
vào **Tổng quan** → **Cập nhật học liệu mẫu**. Bộ cập nhật so fingerprint 0.5, chỉ thay bài còn nguyên,
giữ bài đã sửa, không xóa tiến độ và không nhân đôi dự án khi chạy lại. Kiểm tra số bài đã cập nhật/
được giữ, mở một bài và kiểm học liệu trước khi cho lớp học sử dụng.

Đây vẫn là học liệu thực hành cô đọng, cần mở rộng và chuyên gia rà soát trước đào tạo chính thức;
không phải bộ giáo trình đại học hoàn chỉnh hay chương trình cấp bằng. Các gói không bao gồm
video người giảng quay sẵn, AI tạo video, bài thi có giám sát hoặc dịch vụ chấm thực hành.
App native giữ nội dung text/video fallback; tương tác mới chạy trên web responsive.

## SDK: mở rộng module

| Thành phần | Nơi sửa |
|---|---|
| Types/schema version client | `web/lib/studio/types.ts` |
| Registry, nhãn VI/EN, capabilities và Player | `web/lib/studio/registry.tsx` |
| Editor toàn màn hình và cấu hình | `web/components/studio/project-editor.tsx` |
| Player riêng từng module | `presentation-player.tsx`, `simulation-player.tsx` |
| Thuật toán mô phỏng độc lập UI | `web/lib/studio/simulations.ts` |
| Xuất JSON/HTML/video | `web/lib/studio/export.ts` |
| Tích hợp Tiptap | `web/lib/studio/lesson-node.tsx`, node `studioAsset` |
| Validator server và giới hạn | `backend/yiedu/studio_schema.py`, `authoring.py` |
| CRUD, ACL, audit | `backend/yiedu/studio.py`; bảng `studio_assets` |
| Media mẫu và nâng cấp an toàn | `learning_media.py`, `studio_seed.py`, `content/lesson-baselines.json` |

Thêm loại mới phải cập nhật type union, `registerStudioTool`, editor/player, schema server,
fallback text, snapshot export/restore và test. Chỉ thêm registry frontend chưa đủ.
Mẫu manifest trong `extensions/examples/content-studio` dùng contribution slot `studio-tool`.
Module được đóng gói cùng source sau review; chưa có installer/thanh toán/cô lập code bên thứ ba.

API dưới `/api/v1/runtime/<tenant_id>/studio`: `GET/POST /`, `GET/PUT/DELETE /<id>`;
`POST /starter-content/upgrade` cho owner/admin. Bản sửa gửi revision hiện tại, sai revision nhận 409.
Mỗi dự án có `kind`, `locale`, `data`, revision và timestamps. Tối đa 80 slide và 250KB một dự án;
rich document tối đa 300KB. Snapshot lesson chứa dữ liệu, không phụ thuộc asset ID khi học.
Xóa dự án gốc không làm mất nội dung bài đã chèn. ZIP schema `0005` gồm thư viện Studio;
restore vẫn đọc được snapshot `0002`–`0004` và xác thực dữ liệu mới.

Tham khảo API nền: [Tiptap React node views](https://tiptap.dev/docs/editor/extensions/custom-extensions/node-views/react),
[MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder),
[canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream).
