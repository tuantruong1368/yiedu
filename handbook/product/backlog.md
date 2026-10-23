# P2 — Product backlog và kế hoạch bàn giao

Đây là backlog trong repo, chưa tạo GitHub Issues/Projects. Thứ tự là đề xuất; chưa ước lượng ngày.
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
