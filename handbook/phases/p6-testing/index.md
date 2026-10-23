# P6 — Kiểm thử và đảm bảo chất lượng

## Học điều gì?

Tìm bằng chứng hệ thống đúng, phát hiện rủi ro trước người dùng.

## Đầu vào

Bản build xác định, AC, dữ liệu giả và môi trường test riêng.

## Các bước

### P6.1

Lập test theo FR/NFR, gồm happy path, lỗi và negative security.

### P6.2

Chạy unit/API/integration; dùng PostgreSQL thật cho JSONB/migration.

### P6.3

Ghi bug có bước tái hiện, mức độ, bằng chứng; fix và retest.

### P6.4

Tổng hợp kết quả và giới hạn; đánh giá readiness để chuyển UAT.

## Tài liệu áp dụng

- [Test plan](../../product/test-plan.md)
- [Testing guide](../../guides/testing.md)
- [Bug/issue](../../forms/issue.md)
- [Verification](../../product/verification.md)

## Bài thực hành

Chạy pytest rồi giải thích case nào cần DB. Phân biệt list lọc tenant với xác thực quyền tenant.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Các case bắt buộc có kết quả thực; blocker được xử lý; skip/pending không được báo pass.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P7 — UAT và nghiệm thu](../p7-acceptance/index.md).

## Áp dụng yêu cầu v0.2

- [Test plan v0.2](../../product/test-plan.md)
- [Truy vết](../../product/traceability-v2.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
