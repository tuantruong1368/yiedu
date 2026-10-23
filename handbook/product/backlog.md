# P2 — Product backlog và kế hoạch bàn giao

Backlog gốc BL-001–015 được quản lý trong repo; các nhóm v0.2 đã có GitHub Issues ở cuối trang.
Chưa tạo GitHub Projects. Thứ tự là đề xuất; chưa ước lượng ngày.
Trạng thái “bộ nền” chỉ mô tả phạm vi code đã có, không có nghĩa FR hoàn thành toàn bộ.

| ID | Việc | Yêu cầu | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| BL-001 | Handbook P0–P9, scaffold, CI | FR-014 | Không | Bộ nền đã chuẩn bị |
| BL-002 | API tenant và course metadata | FR-001, FR-005 | BL-001 | Bộ nền đã chuẩn bị |
| BL-003 | Phỏng vấn, chọn nhóm pilot, review scope | Discovery | BL-001 | Chưa thực hiện |
| BL-004 | Auth, membership và ma trận quyền | FR-002 | BL-003 | Chưa triển khai |
| BL-005 | RLS và kiểm thử isolation toàn luồng | NFR-001 | BL-004 | Chưa triển khai |
| BL-006 | Spike Next.js/Puck: SSR, revision, publish | FR-004, FR-012 | Review DEC-005 | Chưa thực hiện |
| BL-007 | Branding, media và trang chủ | FR-003, FR-004 | BL-005, BL-006 | Chưa triển khai |
| BL-008 | Bài học, ghi danh, tiến độ | FR-005, FR-006 | BL-005 | Chưa triển khai |
| BL-009 | Bài kiểm tra | FR-007 | BL-008 | Chưa triển khai |
| BL-010 | Mobile dùng chung và đồng bộ tiến độ | FR-009 | BL-004, BL-008, DEC-006 | Chưa triển khai |
| BL-011 | Gói, thanh toán, đối soát | FR-008, FR-013 | Pilot, chọn cổng thanh toán | Chưa triển khai |
| BL-012 | AI trợ giảng, hạn mức và kiểm quyền | FR-010 | BL-008 | Chưa triển khai |
| BL-013 | Export/restore tenant + cấu hình standalone | FR-011 | BL-005, BL-008 | Chưa triển khai |
| BL-014 | White-label mobile và quy trình phát hành | FR-009, FR-011 | BL-010, BL-013 | Chưa triển khai |
| BL-015 | Staging, UAT, backup/restore, release | NFR-003–007 | Phạm vi release được duyệt | Chưa triển khai |

## Sprint học đầu tiên đề xuất

Mục tiêu: anh hiểu cấu trúc dự án, chạy được bộ nền và ghi nhận câu hỏi P0.
Đầu vào: repo mới, Python, Docker. Công việc: đọc charter; chạy setup; tạo tenant/course;
chạy test; ghi learning notes. Đầu ra: bằng chứng local và danh sách câu hỏi, không phải release SaaS.
Không tự gán sprint 1/2 tuần khi chưa biết lịch của anh.

## Definition of Ready

Có vấn đề/người dùng, FR/AC, phụ thuộc, dữ liệu test, phương án kiểm tra và rủi ro rõ.
## Definition of Done

Đạt AC, kiểm tra phù hợp pass, không rò tenant/secret, migration/tài liệu cập nhật,
có review và bằng chứng. Chưa có bằng chứng thì ghi pending, không tick Done.

## Ước lượng

Tách discovery/spike/dev/test/review/deploy. Ước lượng theo khoảng và giả định; không lấy số dòng code
hay dự đoán AI làm cam kết. Cập nhật sau khi có tốc độ thực tế của các sprint.

## Backlog v0.2 — toàn sản phẩm được mở rộng

Giữ BL-001–015 để không mất lịch sử; các mục sau phân rã/chi tiết hóa phạm vi, không ước lượng trùng.
BL-004 được chi tiết bằng BL-017; BL-007 bằng BL-018–019; BL-008 bằng BL-020;
BL-010 bằng BL-021; BL-013 bằng BL-023; BL-014 (app riêng) là tùy chọn sau app chung.

| ID | Công việc | FR | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| BL-016 | Review vision v0.2, CR-001 và research | FR-015–025 | BL-003 | Đặc tả có sẵn; chưa review kỹ thuật toàn bộ |
| BL-017 | Identity Google/Facebook/email + membership + tenant signup | FR-002, FR-015, FR-019 | BL-016, auth spike | Chưa triển khai |
| BL-018 | Gallery, workspace, builder/revision/template override | FR-015–016 | BL-006, BL-017 | Chưa triển khai |
| BL-019 | Domain reservation, provisioning job, homepage/admin routing | FR-017, FR-025 | BL-005, BL-018 | Chưa triển khai |
| BL-020 | Tenant admin, lesson editor và learning path/version | FR-018 | BL-005, BL-019 | Chưa triển khai |
| BL-021 | App chung: memberships, path/progress, deep link/discovery | FR-009, FR-019 | BL-020, DEC-006 | Chưa triển khai |
| BL-022 | Package contract và compatibility metadata spike | FR-024 | BL-016 | Có validator/examples v0.1; SDK runtime chưa có |
| BL-023 | ZIP/installer/restore, identity và standalone app endpoint spike | FR-020, FR-025 | BL-020–022 | Chưa triển khai |
| BL-024 | Signed core releases, update agent, preflight/recovery | FR-021, FR-025 | BL-023 | Chưa triển khai |
| BL-025 | Extension registry, lifecycle, host isolation và dependency resolver | FR-022 | BL-022, BL-024 | Chưa triển khai |
| BL-026 | Developer portal, review/sign/publish listing | FR-023–024 | BL-025 | Chưa triển khai |
| BL-027 | Marketplace checkout/entitlement/ledger/refund/payout | FR-023 | BL-011, BL-026 | Chưa triển khai |
| BL-028 | E2E full journey, security, Mac/Linux restore và recovery drills | FR-015–025 | Theo từng lát cắt | Chưa thực hiện |

## Đường triển khai theo giá trị

1. Đọc/review P0–P3, auth/domain/editor spike và chốt quyết định kỹ thuật.
2. Template → đăng ký → builder → tenant public/admin, có tenant isolation.
3. Tạo bài giảng/khóa học/lộ trình → learner signup → học trên app chung.
4. Extension contract/registry và ZIP portable, thử endpoint/auth trên standalone.
5. Core/extension updater, recovery và lifecycle cài/gỡ.
6. Developer portal và marketplace thương mại, kiểm toàn hành trình trước phát hành tương ứng.

Không trì hoãn thiết kế portability/extension tới sau khi core đã khóa chặt; triển khai từng lát cắt,
full-product scope vẫn giữ. Không cam kết ngày/chi phí trước spike và capacity thực.


## GitHub Issues v0.2

| Issue | Nhóm công việc | Backlog |
|---|---|---|
| [#1](https://github.com/tuantruong1368/yiedu/issues/1) | Review/spike kiến trúc | BL-016, BL-022 |
| [#2](https://github.com/tuantruong1368/yiedu/issues/2) | Onboarding/template/builder/subdomain | BL-017–019 |
| [#3](https://github.com/tuantruong1368/yiedu/issues/3) | Quản trị bài giảng/khóa học/lộ trình | BL-020 |
| [#4](https://github.com/tuantruong1368/yiedu/issues/4) | App chung và identity | BL-021 |
| [#5](https://github.com/tuantruong1368/yiedu/issues/5) | ZIP/installer/restore | BL-023 |
| [#6](https://github.com/tuantruong1368/yiedu/issues/6) | Updater/extension lifecycle | BL-024–025 |
| [#7](https://github.com/tuantruong1368/yiedu/issues/7) | Developer marketplace | BL-026–028 |

Các issue đang mở, chưa gán deadline/ngân sách hoặc đánh dấu Done. Khi bắt đầu sprint tách story/task
nhỏ, giữ liên kết FR/AC và bằng chứng. Phần metadata validator BL-022 đã có không đóng toàn issue #1.

## Cập nhật thực thi 0.3

| Nhóm | Tiến triển | Phần còn mở |
|---|---|---|
| BL-017–019 | Email/session, template/gallery, workspace/Puck, publish và local routing | Social auth, DNS/TLS/jobs, revision history |
| BL-020 | Course/lesson/path CRUD API, UI tạo/sửa, prerequisite/progress | Quizzes, rich/media, version pinning |
| BL-021 | Expo app source/typecheck/bundles | Thiết bị, deep link, native signing/store |
| BL-022–025 | Metadata + first-party toggles + ZIP/restore local | Third-party host, signed releases/update agent và production recovery |
| BL-026–027 | Developer submit/list metadata pending | Artifact review/signing/checkout/entitlement/ledger/payout |

Các issue #1–7 vẫn mở, xem [release matrix](release-0.3.md). Không gọi partial implementation là Done.
