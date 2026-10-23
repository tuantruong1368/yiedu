# Bắt đầu học và làm YiEdu

## Buổi đầu tiên

1. Đọc [trạng thái](product/status.md): hiểu cái gì chạy được và cái gì đang dự kiến.
2. Đọc [P0](phases/p0-initiation/index.md), sau đó [charter](product/charter.md).
3. Tự trả lời: khách hàng mua gì, khác gì với khóa học, tại sao cần xuất hệ thống?
4. Đọc [quyết định](product/decision-log.md): FastAPI/PostgreSQL đã chốt; frontend chưa chốt.
5. Theo [local setup](guides/local-setup.md), chạy Handbook và API.
6. Ghi câu hỏi vào `handbook/learning-notes.md`; không cần hiểu hết code ngay.

## Học theo thứ tự

| Chặng | Câu hỏi anh cần trả lời | Bài thực hành |
|---|---|---|
| P0 | Tại sao làm, ai quyết định, thành công là gì? | Review charter và ranh giới |
| P1 | Khách hàng có vấn đề này thật không? | Phỏng vấn, ghi bằng chứng |
| P2 | Làm gì trước, nguồn lực nào? | Sắp backlog và lập kế hoạch sprint |
| P3 | Hệ thống phải làm gì, kiểm tra thế nào? | Viết user story và AC |
| P4 | Thiết kế nào đáp ứng yêu cầu? | Đọc API/schema, review rủi ro tenant |
| P5 | Biến yêu cầu thành code thế nào? | Sửa một thay đổi nhỏ có truy vết |
| P6 | Làm sao biết đúng và an toàn? | Chạy test, ghi lỗi |
| P7 | Người dùng có chấp nhận không? | Chạy UAT theo kịch bản |
| P8 | Đưa lên môi trường thật thế nào? | Diễn tập deploy/rollback trên staging |
| P9 | Duy trì và cải tiến thế nào? | Diễn tập incident và đánh giá sprint |

## Nhịp mỗi buổi học

Đọc mục tiêu → thực hành → chạy lệnh kiểm tra → ghi kết quả → hỏi phần chưa hiểu.
Thời gian và số buổi tùy lịch của anh, chưa có deadline cam kết.

## Định nghĩa Done

Một công việc chỉ Done khi đáp ứng AC, kiểm tra liên quan đạt, tài liệu cập nhật và
có bằng chứng review. Một yêu cầu có thể đã mô tả nhưng vẫn chưa triển khai.

[Git workflow](guides/git-workflow.md) giải thích clone, pull, branch, commit và review.

Sau khi chạy được local, làm [bài thực hành đầu tiên](guides/first-lab.md).

## Cập nhật yêu cầu v0.2

Sau P0, đọc [vision mới](product/vision-v2.md), [CR-001](product/changes/CR-001-extensible-platform.md)
và [truy vết](product/traceability-v2.md) để hiểu tác động khi mở rộng phạm vi.
Học quản lý thay đổi: yêu cầu mới → AC → kiến trúc/data → backlog → test/UAT → code theo sprint.
Nếu muốn xem metadata extension, theo [developer quickstart](guides/developer-quickstart.md).
