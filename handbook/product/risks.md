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

## Rủi ro bổ sung v0.2

| ID | Rủi ro | Ưu tiên | Kiểm soát đề xuất |
|---|---|---|---|
| R-11 | Extension chiếm quyền shared host | Cao | Review, isolation, capability enforcement, không arbitrary upload execution |
| R-12 | Update mất dữ liệu hoặc supply-chain compromise | Cao | Chữ ký/trust root, preflight, compatible migration, recovery drill |
| R-13 | Wildcard/callback/cookie sai tenant | Cao | Verified domain router, callback allowlist, host-only cookie, negative test |
| R-14 | SaaS account/app không dùng được sau export | Cao | Identity/instance discovery spike, không tái dùng token sai issuer |
| R-15 | License package không cho đóng ZIP | Cao | Entitlement/redistribution check và báo blocker trước export |
| R-16 | Marketplace payout/refund/abuse | Cao | Review, ledger idempotent, quyết định chính sách và đơn vị chuyên môn phù hợp |
