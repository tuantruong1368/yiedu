# CR-006 — template, Yoga và điều hướng ổn định

Anh Tuân yêu cầu chín nhóm chỉnh sửa: phân nhóm mẫu/section màu, hover, giáo trình Yoga,
preview hoàn chỉnh, một logo admin, Studio nhúng và Back đúng ngữ cảnh, tên nút theo công cụ,
giảm giật/nháy và bổ sung thành phần còn thiếu phục vụ các luồng trên.

| AC | Kết quả cần đạt | Kiểm chứng |
|---|---|---|
| AC-006-01 | 7 nhóm + tất cả, tìm không dấu, giữ nhóm/từ khóa | `experience.spec.ts`, catalog group tests |
| AC-006-02 | Card hover/focus nhẹ; section phân vùng màu, menu mobile truy cập được | Browser hover/computed opacity, ảnh và preview mobile |
| AC-006-03 | Yoga 4 chuyên đề/16 bài VI/EN, 6 video có nguồn, seed độc lập và học được | Validator, yoga integration và learner browser |
| AC-006-04 | Preview có logo/menu/CTA, đủ 5 trang, course link trong preview | Render API tests, browser 5 page + brand |
| AC-006-05 | Admin có một logo tenant; Studio ở panel phải | Browser DOM/sidebar identity + ảnh |
| AC-006-06 | Mỗi tool mở full page; Back giữ bộ lọc/khóa/bài, cả nested tool và reload | Studio/context browser và workspace regression |
| AC-006-07 | Tên nút Tạo slide/Tạo video/Tạo mô phỏng | Browser tool cards |
| AC-006-08 | Nội bộ không full reload, filter không ghi đè khi thao tác nhanh, save không remount | Window sentinel, rapid filter, save notice/title persist |
| AC-006-09 | Có tìm/lọc, empty/error/retry/404, nguồn video và asset Docker/ZIP/mobile | Build, browser, pytest export, CI Compose asset HTTP và mobile |

Không thêm migration, ghi đè tenant cũ hoặc đổi schema snapshot. Mẫu Yoga và source/video giữ
trạng thái biên tập, cần chuyên gia rà soát; chưa chứng nhận hiệu quả tập hoặc kỹ thuật người học.
[Hướng dẫn](../../guides/experience-yoga.md), [phạm vi](../release-0.8.md).
