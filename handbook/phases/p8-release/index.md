# P8 — Phát hành và bàn giao

## Học điều gì?

Đưa phiên bản đã chấp nhận lên môi trường đích có khả năng khôi phục.

## Đầu vào

UAT đạt, phạm vi release, ngân sách và người vận hành được xác nhận.

## Các bước

### P8.1

Chốt tag/image, migration, cấu hình, secret và checklist release.

### P8.2

Diễn tập staging: backup, migration, smoke, restore/rollback.

### P8.3

Chỉ deploy production sau quyết định release; theo dõi sau deploy.

### P8.4

Bàn giao runbook, tài khoản/quyền phù hợp, hỗ trợ và giới hạn.

## Tài liệu áp dụng

- [Release/operations](../../product/release-operations.md)
- [Mẫu release](../../forms/release.md)

## Bài thực hành

Lập checklist staging giả định và đánh dấu các điều kiện hiện chưa đạt. Chưa tạo tài nguyên trả phí.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Có bằng chứng deploy, smoke, giám sát và rollback; không khai báo production khi mới commit CI.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P9 — Vận hành và cải tiến](../p9-operations/index.md).

## Áp dụng yêu cầu v0.2

- [Signed updates](../../product/updates.md)
- [ZIP/restore](../../product/standalone-export.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
