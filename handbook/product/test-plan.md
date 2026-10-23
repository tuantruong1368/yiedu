# P6 — Kế hoạch kiểm thử và truy vết

## Các tầng kiểm tra

| Tầng | Kiểm tra | Hiện trạng |
|---|---|---|
| Unit/API boundary | Validation, auth key, health | Có test |
| PostgreSQL integration | Migration, uniqueness, FK, tenant-filtered lists | Có test và job CI |
| End-to-end | Đăng ký → tạo hệ thống → học | Chưa có UI/auth nên chưa thực hiện |
| Security | Membership, cross-tenant, file/cache/job isolation | Chưa đạt, blocker public |
| Performance | p95, lỗi, video/DB/AI dưới workload | Chưa đo, chưa chốt chỉ tiêu |
| Recovery | Backup/restore, export standalone | Chưa triển khai |
| UAT | Chủ sản phẩm/khách hàng chạy kịch bản | Chưa nghiệm thu |

## Kịch bản bộ nền

TC-001 không key/sai key → 401. TC-002 slug/tên sai → 422.
TC-003 tạo tenant → 201; tạo trùng → 409.
TC-004 tạo course cùng slug cùng tenant → 409; khác tenant được phép.
TC-005 list course tenant B không có course A.
TC-006 tenant không tồn tại → 404. TC-007 limit ngoài phạm vi → 422.
TC-008 readiness DB kết nối → 200. TC-009 migration upgrade/downgrade/upgrade và drift check.

TC-005 chỉ chứng minh bộ lọc API admin, không chứng minh customer tenant isolation.
Trước public phải bổ sung đăng nhập với role/member thật và test cố tình đổi UUID/hostname/token.

## Quy tắc xử lý lỗi

Blocker: lộ dữ liệu, thanh toán sai, mất dữ liệu, không vào được luồng chính.
Không release khi blocker chưa xử lý hoặc chưa được đánh giá/giải quyết phù hợp.
Ghi bug có bước tái hiện, mong đợi, thực tế, môi trường, mức độ và bằng chứng đã che secret.

## Thực hành

Theo [testing guide](../guides/testing.md). Kết quả chạy ghi vào [verification](verification.md),
không ghi pass chỉ vì test file tồn tại hoặc pipeline đã được tạo.
