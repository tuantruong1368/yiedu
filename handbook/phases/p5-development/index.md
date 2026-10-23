# P5 — Phát triển theo sprint

## Học điều gì?

Thực hiện từng thay đổi nhỏ có kiểm tra và tài liệu đi kèm.

## Đầu vào

Task Ready, thiết kế và môi trường local chạy được.

## Các bước

### P5.1

Kéo code, tạo branch, xác định AC và test cần chạy trước khi sửa.

### P5.2

Cập nhật spec/code/migration theo một thay đổi tập trung.

### P5.3

Chạy kiểm tra liên quan, tự review diff, loại secret/dữ liệu thật.

### P5.4

Commit có ý nghĩa, PR và CI; demo kết quả, cập nhật status/backlog.

## Tài liệu áp dụng

- [Local setup](../../guides/local-setup.md)
- [Git workflow](../../guides/git-workflow.md)
- [Testing](../../guides/testing.md)

## Bài thực hành

Sau khi hiểu bộ nền, thêm một trường mô tả course với migration, schema, test và tài liệu trên branch riêng.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Code đáp ứng AC, CI liên quan pass, tài liệu/migration khớp; không coi code sinh bởi AI là đã kiểm chứng.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P6 — Kiểm thử và đảm bảo chất lượng](../p6-testing/index.md).
