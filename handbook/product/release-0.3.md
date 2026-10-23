# Trạng thái triển khai 0.3.0

Đây là bản chạy local để review sản phẩm và học, không phải tuyên bố hoàn tất mọi FR.

| Năng lực | Đã có | Giới hạn còn lại |
|---|---|---|
| Tài khoản | Email/password, scrypt, opaque session lưu DB, logout, HttpOnly cookie/Bearer | Chưa verification/reset/MFA/OAuth; rate limit memory chỉ cho local |
| Template/onboarding | Ba mẫu, giữ selection qua đăng ký/login, workspace owner-only | Chưa thương mại template/license |
| Builder | Puck, bốn loại block, save draft/revision, publish | Chưa revision history/rollback UI, media upload, page locales |
| Tenant | Slug unique/reserved names, publish idempotent theo workspace, hostname rewrite | Local path/.localhost; chưa DNS/TLS/provision async job |
| Quản trị | Role owner/admin/instructor/learner, membership, overview/audit | Chưa RLS hay composite tenant FK toàn schema; cần hardening trước public |
| Khóa học/bài học | Create/edit/delete API, publish, text + direct HTTPS video | UI tạo/sửa; chưa media storage, rich content versioning, quizzes |
| Lộ trình | Ordered courses, cycle check xuyên path, create/edit/delete | Revision counter; chưa pin path version cho enrollment hiện có |
| Học tập | Tenant join, enrollment free, prerequisite, nội dung có kiểm quyền, completion idempotent | Chưa paid enrollment, quiz score, offline sync |
| Tiện ích | Bật/tắt first-party certificates và activity log | Không cài/chạy arbitrary third-party code |
| Developer | Gửi/list metadata manifest và trạng thái submitted | Chưa artifact upload/review/signing/publish/sales/payout |
| ZIP | Source web/API + snapshot tenant + checksum + restore script | Không ký, synchronous/bounded; không kèm file video ngoài hoặc cloud adapters |
| Standalone | Restore vào DB/schema sạch, tạo lại mật khẩu, workspace owner | Chưa thử Docker/Mac M1 restore toàn ứng dụng; chưa OAuth/mobile federation tự động |
| Update | Hiển thị trạng thái chưa cấu hình, không tự áp bản không xác minh | Registry/trust/sign/apply/recovery chưa triển khai |
| App | SecureStore, chọn instance lúc login, memberships/course/path/lesson/video/progress | Typecheck/bundle đạt; chưa thiết bị thật, deep link/QR, signed binary/store |
| Hạ tầng | Compose db/migrate/api/web; CI | Chưa deploy cloud, production security/backup/observability/load/UAT |

## Truy vết code

Backend: `auth.py`, `product.py`, `product_schemas.py`, `portable.py`; migration 0002.
Frontend: `web/app`, `web/components`; mobile: `mobile/App.tsx`.
Test: `tests/test_product_integration.py`, `web/tests/journey.spec.ts`.
FR-001–025 vẫn theo [SRS](requirements.md); bảng trên là mức triển khai thực tế, không đóng toàn bộ yêu cầu.

## Cổng trước public

Auth recovery/verification, HTTPS và cookie secure, provider config, phân tách tenant được đánh giá,
rate limit chia sẻ, giới hạn job/upload/export, backup/restore, secrets và vulnerability review,
hiệu năng/chi phí, UAT và cấu hình hạ tầng. Các điều này chưa đạt trong release local.
Không coi Docker image build hoặc test green là quyết định phát hành thương mại.
