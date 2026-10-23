# P2 — Lập kế hoạch và backlog

## Học điều gì?

Biến mục tiêu thành công việc có thứ tự, phụ thuộc và khả năng kiểm tra.

## Đầu vào

Kết quả discovery, nguồn lực và ràng buộc được ghi nhận.

## Các bước

### P2.1

Chia capability thành epic/story/task; mỗi task gắn đầu ra cụ thể.

### P2.2

Ưu tiên theo giá trị, rủi ro, phụ thuộc và công sức; ghi lý do.

### P2.3

Ước lượng theo khoảng; tách spike, dev, test và review.

### P2.4

Chốt mục tiêu sprint, capacity và Definition of Done; giới hạn việc đang làm.

## Tài liệu áp dụng

- [Backlog](../../product/backlog.md)
- [Mẫu sprint](../../forms/sprint.md)
- [Rủi ro](../../product/risks.md)

## Bài thực hành

Chọn một mục tiêu học nhỏ từ backlog và phân rã tối đa vài task có AC, ghi điều có thể làm trễ.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Sprint có mục tiêu, công việc đủ Ready, owner và tiêu chí Done; không gán ngày khi thiếu capacity.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

Tiếp theo: [P3 — Phân tích yêu cầu](../p3-requirements/index.md).

## Áp dụng yêu cầu v0.2

- [Backlog v0.2](../../product/backlog.md)
- [Marketplace](../../product/marketplace.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
