# P9 — Vận hành và cải tiến

## Học điều gì?

Giữ hệ thống tin cậy và dùng dữ liệu thật để quyết định phát triển tiếp.

## Đầu vào

Phiên bản chạy thực tế, owner vận hành, chỉ số và kênh hỗ trợ.

## Các bước

### P9.1

Theo dõi lỗi, latency, chi phí, backup và hoạt động sản phẩm.

### P9.2

Xử lý incident theo mức ảnh hưởng, khôi phục rồi postmortem.

### P9.3

Review phản hồi/chỉ số và cập nhật backlog/roadmap.

### P9.4

Retrospective cách làm; cải tiến nhỏ và kiểm lại ở sprint sau.

## Tài liệu áp dụng

- [Runbook](../../product/release-operations.md)
- [Incident](../../forms/incident.md)
- [Sprint/retro](../../forms/sprint.md)

## Bài thực hành

Diễn tập DB local dừng: quan sát readiness 503, bật lại DB và kiểm tra dữ liệu còn. Không xóa volume.

## Lệnh kiểm tra tài liệu

Chạy tại thư mục gốc repo, đã kích hoạt `.venv`:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

Hai lệnh chỉ kiểm tra cấu trúc/link/build; không tự xác nhận chất lượng nghiệp vụ.

## Điều kiện qua bước

Có người phụ trách, diễn tập recovery, chỉ số và vòng phản hồi; chưa có người dùng thì không bịa metrics.

Người chịu trách nhiệm: anh Tuân; AI hỗ trợ chuẩn bị và phân tích. Ghi kết quả thực tế vào
[nhật ký học](../../learning-notes.md), không đánh dấu hoàn thành vì đã đọc xong trang.

## Áp dụng yêu cầu v0.2

- [Update/recovery](../../product/updates.md)
- [Marketplace support](../../product/marketplace.md)

Phạm vi và đặc tả đã cập nhật; hoạt động thực tế vẫn theo trạng thái/bằng chứng, không tự đánh dấu Done.
