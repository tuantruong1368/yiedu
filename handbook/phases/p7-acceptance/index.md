# P7 — UAT và nghiệm thu

## Học điều gì?

Xác nhận sản phẩm đáp ứng công việc thực tế của người dùng trong phạm vi bàn giao.

## Đầu vào

Bản build ổn định, kết quả test, phạm vi và người nghiệm thu.

## Các bước

### P7.1

Chuẩn bị kịch bản UAT theo vai trò và dữ liệu giả gần thực tế.

### P7.2

Người dùng/chủ sản phẩm thực hiện, ghi kết quả không thay họ phán đoán.

### P7.3

Phân loại lỗi và yêu cầu mới; không ngầm mở rộng phạm vi.

### P7.4

Ghi quyết định chấp nhận/từ chối, điều kiện và người chịu trách nhiệm.

## Tài liệu áp dụng

- [UAT YiEdu](../../product/uat.md)
- [Biên bản nghiệm thu](../../forms/acceptance.md)

## Bài thực hành

Nghiệm thu scaffold local ở đúng phạm vi API admin; không đánh dấu hoàn tất UAT sản phẩm SaaS.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Có người thực hiện, commit/môi trường, kết quả từng case và quyết định; demo không thay biên bản.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P8 — Phát hành và bàn giao](../p8-release/index.md).
