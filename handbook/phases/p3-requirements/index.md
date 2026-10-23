# P3 — Phân tích yêu cầu

## Học điều gì?

Chuyển mong muốn thành hành vi có thể quan sát và kiểm thử.

## Đầu vào

Journey, backlog ưu tiên và quyết định phạm vi.

## Các bước

### P3.1

Viết actor và use case cho luồng tạo hệ thống → cấu hình → tạo khóa học → học thử.

### P3.2

Viết user story và Given/When/Then; thêm lỗi, quyền và trường hợp biên.

### P3.3

Ghi business rules, dữ liệu, yêu cầu bảo mật/hiệu năng/khôi phục.

### P3.4

Review SRS, liên kết FR → backlog → test; thay đổi qua change request.

## Tài liệu áp dụng

- [SRS](../../product/requirements.md)
- [Mẫu story](../../forms/user-story.md)
- [Change request](../../forms/change-request.md)

## Bài thực hành

Viết AC cho slug trùng cùng tenant và trùng khác tenant. Giải thích tại sao tenant_id không là quyền truy cập.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Yêu cầu ưu tiên không mơ hồ, có AC/test; phân biệt yêu cầu mục tiêu với trạng thái code.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P4 — Thiết kế giải pháp](../p4-design/index.md).

## Áp dụng yêu cầu v0.2

- [Truy vết v0.2](../../product/traceability-v2.md)
- [Identity/mobile](../../product/identity-mobile.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
