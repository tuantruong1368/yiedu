# P0 — Khởi tạo dự án

## Học điều gì?

Xác định lý do tồn tại, trách nhiệm và ranh giới trước khi cam kết thực hiện.

## Đầu vào

Ý tưởng nền tảng tạo e-learning; FastAPI/PostgreSQL đã chốt; repo mới.

## Các bước

### P0.1

Review charter: phân biệt vấn đề, giải pháp, mục tiêu và giả định.

### P0.2

Liệt kê stakeholder; xác định ai có quyền quyết định và ai chỉ tham vấn.

### P0.3

Review phạm vi tổng thể và đợt bàn giao; ghi điều chưa cam kết.

### P0.4

Ghi rủi ro, nguồn lực thực có, điều kiện thành công và các quyết định.

## Tài liệu áp dụng

- [Charter](../../product/charter.md)
- [Stakeholder/RACI](../../product/stakeholders.md)
- [Phạm vi](../../product/scope.md)
- [Rủi ro](../../product/risks.md)
- [Quyết định](../../product/decision-log.md)

## Bài thực hành

Viết lại mô tả YiEdu trong ba câu. Nêu ba điều chưa biết; không tự điền số doanh thu/deadline.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Anh diễn đạt được YiEdu bán gì, ai dùng, ai quyết định; các giả định chưa biết được ghi rõ.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P1 — Khám phá khách hàng](../p1-discovery/index.md).

## Áp dụng yêu cầu v0.2

- [Vision v0.2](../../product/vision-v2.md)
- [CR-001](../../product/changes/CR-001-extensible-platform.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
