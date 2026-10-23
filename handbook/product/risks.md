# Risk register

Đánh giá định tính ban đầu, cần review định kỳ. Owner hiện tại: anh Tuân.

| ID | Rủi ro | Mức ưu tiên | Giảm thiểu / dấu hiệu kích hoạt |
|---|---|---|---|
| R-01 | Không có nhu cầu trả tiền | Cao | Phỏng vấn và pilot trước mở rộng; theo dõi bỏ dở onboarding |
| R-02 | Rò dữ liệu chéo tenant | Cao | Auth/membership, composite constraints, RLS, negative tests trước public |
| R-03 | Phạm vi quá lớn cho nguồn lực | Cao | Lát cắt theo sprint, giới hạn WIP, review thay đổi |
| R-04 | Chi phí video/băng thông/AI tăng | Cao | Hạn mức, đo usage theo tenant, cảnh báo; chưa chốt giá gói |
| R-05 | Export thiếu dữ liệu hoặc phụ thuộc cloud | Cao | Manifest, adapter và restore drill môi trường sạch |
| R-06 | App riêng khó phát hành hoặc bảo trì | Trung bình–cao | Build pipeline, ký app bằng tài khoản phù hợp, kiểm chính sách khi phát hành |
| R-07 | Chủ dự án kiêm mọi vai trò | Cao | Checklist, CI, bằng chứng và review độc lập khi có nguồn lực |
| R-08 | Mất dữ liệu hoặc migration sai | Cao | Backup, restore drill, expand/contract, diễn tập rollback |
| R-09 | Sai quyền sử dụng nội dung/code | Cao | Rà giấy phép dependencies và điều khoản xuất hệ thống trước thương mại |
| R-10 | Dữ liệu cá nhân trong repo public | Cao | Dữ liệu giả, secret scan, không lưu danh sách học viên thật |

## Issue khác risk thế nào?

Risk là việc có thể xảy ra; issue là việc đã xảy ra. Khi rủi ro kích hoạt, tạo issue,
ghi tác động, người xử lý, thời điểm cập nhật và quyết định. Dùng [mẫu issue](../forms/issue.md).
