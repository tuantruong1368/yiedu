# Core và extension update lifecycle

Trạng thái: đặc tả FR-021, FR-022; chưa có update service hoặc tự cập nhật runtime.

## Tách nội dung khỏi mã nguồn

Core release immutable; tenant content/config ở database/storage. Override giao diện có layer riêng.
Update không ghi đè bài giảng, page revision hoặc custom config. API/schema/extension versions có ma trận
compatibility. Major hoặc thay đổi phá vỡ phải có kế hoạch chuyển đổi, không tự áp vào mọi tenant.

## Ba cơ chế

| Môi trường | Cập nhật | Chính sách |
|---|---|---|
| Shared SaaS | Deploy image/schema chung, rollout từng cohort | Tenant không tự chọn arbitrary binary version |
| Managed dedicated | Orchestrator theo instance | Health, schedule và rollback riêng |
| Standalone | Updater local pull signed release | Admin opt-in patch tự động, lịch maintenance, có manual/offline package |

Tự động là mục tiêu có kiểm soát, không có nghĩa YiEdu có quyền điều khiển mọi server khách hàng.
Không có mạng: core learning hiện tại vẫn chạy, cập nhật cần gói đã tải/kiểm chứng và admin thực hiện.
Nếu tùy biến bằng sửa core trực tiếp, updater phải phát hiện drift và chặn/đề nghị xử lý thay vì ghi đè.

## Trạng thái job

available → preflight → snapshot/backup_verified → staged → migrating → health_check → committed.
Lỗi → blocked/failed → recover theo kế hoạch đã kiểm chứng. Lock chống chạy đồng thời;
checkpoint/idempotency khi mất điện, timeout hoặc retry; log không lộ secret.

## Preflight và trust

Xác minh release signature bằng trust root phân phối trước, checksum/size, platform/core/API range,
lockfile phụ thuộc, compatibility, dung lượng, backup/restore point, quota và maintenance window.
Key rotation/revocation và chống downgrade không chủ đích cần policy; checksum một mình không xác thực publisher.
Registry bị tấn công/không liên lạc được phải fail closed cho update, không ngăn người dùng học bình thường.

## Database và rollback

Expand → migrate/backfill → code chuyển đổi → contract theo cửa sổ tương thích.
Không giả định rollback image có thể đảo migration phá dữ liệu. Shared DB restore toàn bộ ảnh hưởng mọi tenant;
phải có forward-fix hoặc recovery được diễn tập, không tự phục hồi toàn DB chỉ vì lỗi một tenant.
Backup có sẵn không bằng restore đã kiểm chứng. RPO/RTO và thời gian maintenance chưa chốt.

## Extension update

Resolve dependency/compatibility trước, thử staging/canary và giữ cấu hình tenant.
Update template cần merge/versioned override, không tự thay nội dung đã chỉnh. Plugin state/data migrations
phân biệt schema chung và dữ liệu tenant. Core báo extension chặn nâng cấp và hướng xử lý.

## AC

- AC-021-01: patch tương thích đi qua preflight/backup/migrate/health và giữ dữ liệu, branding, membership.
- AC-021-02: signature sai, dependency conflict, backup thiếu hoặc core drift thì không apply.
- AC-021-03: crash giữa chừng resume an toàn, không chạy migration/job hai lần.
- AC-021-04: recovery drill chứng minh khả năng phục hồi theo loại migration; không cam kết zero downtime vô căn cứ.
- AC-021-05: tenant export offline vẫn học được; updater chỉ kết nối khi có cấu hình/ủy quyền và mạng.
