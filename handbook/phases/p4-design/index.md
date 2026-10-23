# P4 — Thiết kế giải pháp

## Học điều gì?

Chọn cách đáp ứng yêu cầu, chỉ rõ đánh đổi và khả năng vận hành.

## Đầu vào

SRS ưu tiên, NFR, backlog và rủi ro.

## Các bước

### P4.1

Xác định ranh giới Control Plane/Runtime và module; tránh microservices sớm.

### P4.2

Thiết kế bảng, unique/FK, transaction và tenant isolation.

### P4.3

Thiết kế API, auth, lỗi, pagination và version.

### P4.4

Spike editor/mobile/export; ghi ADR và review trước triển khai rộng.

## Tài liệu áp dụng

- [Kiến trúc](../../product/architecture.md)
- [Database](../../product/data-model.md)
- [API](../../product/api-contract.md)
- [ADR](../../forms/adr.md)

## Bài thực hành

Đọc migration 0001 và model. Giải thích vì sao course slug unique theo tenant và branding dùng JSONB.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Thiết kế truy vết về yêu cầu; xử lý được quyền, dữ liệu và lỗi; quyết định có căn cứ hoặc spike pending.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P5 — Phát triển theo sprint](../p5-development/index.md).

## Áp dụng yêu cầu v0.2

- [Extension architecture](../../product/extensions.md)
- [Core updater](../../product/updates.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
