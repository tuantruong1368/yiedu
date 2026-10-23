# P3 — SRS YiEdu: yêu cầu và tiêu chí chấp nhận

Trạng thái: baseline đề xuất để review; không đồng nghĩa tính năng đã triển khai.
Từ “phải” trong bảng là yêu cầu mục tiêu, chưa là cam kết phát hành.

## Thuật ngữ

Tenant: một hệ thống e-learning của khách hàng. Platform admin: quản trị toàn nền tảng.
Tenant owner/admin: quản trị trong tenant. Instructor: giảng viên. Learner: học viên.
Control Plane: quản lý dịch vụ YiEdu. LMS Runtime: phần e-learning có thể tách triển khai.
Một user có thể có membership ở nhiều tenant với vai trò khác nhau.

## Yêu cầu chức năng

| ID | Năng lực | Tiêu chí chấp nhận mục tiêu |
|---|---|---|
| FR-001 | Tạo tenant | Tên hợp lệ, slug duy nhất, lưu được và trả mã ID; trùng trả 409 |
| FR-002 | Đăng nhập và membership | Xác thực danh tính; chỉ thành viên có quyền mới truy cập tenant |
| FR-003 | Branding | Lưu logo/màu/tên; hiển thị đúng tenant sau tải lại |
| FR-004 | Page builder | Lưu nháp, preview, publish, phục hồi revision; render đúng trang tenant |
| FR-005 | Khóa học và bài học | Quản lý cấu trúc; phân biệt draft/published; chỉ học viên đủ quyền xem |
| FR-006 | Ghi danh và tiến độ | Ghi danh không trùng; cập nhật tiến độ idempotent, không vượt quyền |
| FR-007 | Bài kiểm tra | Lưu lần làm, chấm theo quy tắc; học viên không đọc được đáp án trước phép |
| FR-008 | Thuê bao/thanh toán | Webhook xác thực, xử lý lặp không cấp quyền/ghi tiền hai lần |
| FR-009 | Mobile | Đăng nhập, xem khóa học, học và đồng bộ tiến độ; kiểm tra Android/iOS |
| FR-010 | AI hỗ trợ | Chỉ truy cập tài liệu được phép; giới hạn chi phí và ghi nhận lỗi |
| FR-011 | Xuất độc lập | Xuất đúng tenant, kiểm manifest/checksum, khôi phục trên môi trường sạch |
| FR-012 | Web công khai và SEO | Việt/Anh, HTML có nội dung, metadata/canonical đúng tên miền, sitemap |
| FR-013 | Quản trị dịch vụ | Quản lý gói và tenant, lưu audit khi thao tác nhạy cảm |
| FR-014 | Handbook và học quản lý dự án | Có P0–P9, hướng dẫn thực hành; quyền khu học public cần quyết định |

## Yêu cầu phi chức năng

| ID | Nội dung | Cách chứng minh |
|---|---|---|
| NFR-001 | Cô lập tenant toàn bộ DB/file/cache/task/search/export | Negative test ma trận vai trò, tenant và tài nguyên |
| NFR-002 | Tính nhất quán nghiệp vụ | Ràng buộc DB, transaction, test xung đột và retry |
| NFR-003 | Quan sát và bảo mật | Log có request ID, không log secret/PII; alert và test quyền |
| NFR-004 | Khôi phục | Diễn tập restore, đo RPO/RTO; chỉ tiêu cần thống nhất trước release |
| NFR-005 | Hiệu năng | Đo p95 và tỷ lệ lỗi với workload được chốt; chưa đặt SLA tùy ý |
| NFR-006 | Khả năng di chuyển | Runtime và schema chạy được trên PostgreSQL độc lập; adapter dịch vụ |
| NFR-007 | Khả năng tiếp cận | Kiểm bàn phím, nhãn, tương phản ở các luồng chính |

## Quy tắc dữ liệu quan trọng

Tenant slug duy nhất toàn nền tảng. Course slug duy nhất trong tenant, được phép trùng ở tenant khác.
Mọi truy cập tài nguyên phải kiểm tra membership/role; tenant_id từ URL không chứng minh quyền.
Dữ liệu trang editor cần schema_version và xác thực component/props phía server trước publish.
Giá và số tiền dùng numeric hoặc đơn vị tiền nhỏ nhất, không dùng float.

## Truy vết bộ nền

| Yêu cầu | Code hiện tại | Bằng chứng / giới hạn |
|---|---|---|
| FR-001 | POST/GET tenants | Test PostgreSQL; chỉ admin, chưa onboarding khách hàng |
| FR-005 | POST/GET courses | Chỉ tạo/list metadata, chưa bài học hay publish |
| NFR-001 | courses lọc theo tenant_id | Test danh sách riêng; chưa tenant auth/RLS nên chưa đạt yêu cầu |
| FR-014 | Handbook | Kiểm link/build; chưa triển khai khu học trên sản phẩm |

Các FR còn lại đang backlog. Xem [backlog](backlog.md) và [kế hoạch test](test-plan.md).
