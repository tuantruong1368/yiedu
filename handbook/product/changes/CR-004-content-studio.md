# CR-004 — template thật và Content Studio

Yêu cầu anh Tuân ngày 24/10/2026: ảnh template phản ánh website được tạo; homepage thể hiện
giá trị tạo hệ thống e-learning riêng; menu/trang chạy đủ; trình bài giảng toàn màn hình;
slide/video/mô phỏng là công cụ độc lập trong quản trị; Yirobot/Yisoft có học liệu dùng công cụ.

## Tiêu chí nghiệm thu

| AC | Hành vi | Bằng chứng |
|---|---|---|
| AC-004-01 | Card template dựng chính document mẫu, có link xem website/bài học | `templates.spec.ts`, `studio.spec.ts` |
| AC-004-02 | Menu/nút theo page ID vẫn tới đúng slug sau sửa; website đủ 5 trang | `studio.spec.ts` |
| AC-004-03 | Công cụ độc lập tạo/lưu/mở lại, thư viện đúng tenant và role | `test_studio.py`, integration Studio, browser Studio |
| AC-004-04 | Soạn bài toàn màn hình; chèn/sửa học liệu, xem như learner, lưu/mở lại | browser Studio và journey |
| AC-004-05 | Tải được video thật từ canvas, JSON/HTML và in slide | browser Studio kiểm file video; HTML/PDF qua browser print |
| AC-004-06 | Learner ghi danh, xem media, tương tác và hoàn thành | browser Studio, integration snapshot/enrollment |
| AC-004-07 | Cập nhật nội dung cũ giữ bài đã sửa, không nhân đôi và giữ progress | integration starter upgrade; fingerprint baseline |
| AC-004-08 | Xuất/restore thư viện và snapshot; schema, migration, revision conflict | integration Studio, Alembic, CI |

## Tác động

Schema `0005`, dự án JSON có phiên bản, contribution `studio-tool`; thêm API có membership/ACL.
Không xóa dữ liệu cũ hoặc tự ghi đè nội dung do khách sửa. Native hiện dùng fallback text/video.
Marketplace, server media storage, AI video, video dựng trên worker và giáo trình đại học đầy đủ
vẫn chưa được triển khai bởi CR này. [Hướng dẫn](../../guides/content-studio.md).
