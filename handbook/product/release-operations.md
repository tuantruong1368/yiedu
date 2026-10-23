# P8–P9 — Phát hành và vận hành

Trạng thái: runbook dự kiến. Chưa có staging/production, chưa có URL public hoặc SLA.

## Môi trường

Local dùng dữ liệu giả. CI dùng DB tạm. Staging cần tài khoản/secret riêng, hạn mức và dữ liệu giả.
Production chỉ tạo sau review ngân sách, vùng dữ liệu, bảo mật và phạm vi phát hành.
Không dùng chung secret/database giữa các môi trường.

## Checklist trước release

- Chốt phạm vi release, commit/tag và người chịu trách nhiệm.
- Auth/membership/tenant isolation đã kiểm tra; không dùng admin key scaffold cho người dùng.
- Test/CI/UAT đạt và có bằng chứng; không có blocker.
- Migration diễn tập, backup thành công và restore đã kiểm chứng.
- Secret ngoài git; HTTPS; quyền tối thiểu; storage private theo chính sách.
- Logging có request ID, metrics, cảnh báo và người nhận được chỉ định.
- Ước lượng chi phí DB, storage, băng thông và AI; có quota/budget alert.
- Có kế hoạch rollback, hỗ trợ và thông báo cho người dùng nếu bị ảnh hưởng.

## Trình tự deploy đề xuất

Build image bất biến → deploy staging → backup → chạy migration có kiểm soát → smoke/UAT →
review → deploy production → smoke → theo dõi lỗi/latency → quyết định giữ hoặc rollback.
Migration có job riêng; không mặc định mọi replica tự chạy migration lúc khởi động.

## Rollback

Rollback image chỉ an toàn nếu schema còn tương thích. Trước thay đổi phá hủy cần kế hoạch
expand/contract và phục hồi dữ liệu. Không chạy downgrade xóa bảng production như một thao tác thường lệ.
Ghi thời điểm, image trước/sau, migration version và kết quả kiểm tra sau rollback.

## Backup và restore

Chốt RPO (mất tối đa bao nhiêu dữ liệu) và RTO (phục hồi trong bao lâu) theo giá trị kinh doanh.
Có backup chưa đủ; diễn tập restore vào môi trường tách biệt và đo kết quả.
Với Cloud SQL, kiểm cấu hình backup/PITR theo dịch vụ và chi phí thực tế khi triển khai.

## Incident

Phát hiện → đánh giá tác động → khoanh vùng/giảm thiểu → khôi phục → kiểm tra → thông báo phù hợp →
postmortem không đổ lỗi. Nếu liên quan secret: thu hồi/đổi secret, kiểm log và phạm vi ảnh hưởng.
Dùng [mẫu incident](../forms/incident.md).

## Theo dõi sản phẩm

Tỷ lệ tạo tenant thành công, thời gian tạo khóa học đầu tiên, hoàn thành học, lỗi thanh toán,
chi phí theo tenant, lượng hỗ trợ và nhu cầu export. Chưa có số liệu thật.
Sau mỗi sprint: demo, review chỉ số, retrospective và cập nhật backlog.

## Vận hành v0.2

Bổ sung checklist domain/TLS và OAuth callbacks trước publish tenant; không cho unknown host fallback.
Provision/export/update là job có state, retry/idempotency, audit và theo dõi queue.
Release registry/signing keys là tài sản riêng, không nằm trong ZIP khách hàng.
Theo dõi compatibility của core/extension và cohort; không hứa version tùy ý cho tenant shared.
[Core update lifecycle](updates.md) và [export](standalone-export.md) là runbook mục tiêu,
chưa có hạ tầng hay diễn tập production. App chung cần policy tương thích với instance standalone.
