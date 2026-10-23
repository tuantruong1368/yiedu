# P7 — UAT và nghiệm thu

Trạng thái: kịch bản chuẩn bị, chưa nghiệm thu. Người chấp nhận: chủ sản phẩm và pilot theo phạm vi.

| ID | Vai trò | Kịch bản | Điều kiện đạt | Kết quả |
|---|---|---|---|---|
| UAT-01 | Tenant owner | Đăng ký và tạo hệ thống | Đúng tên/slug, không truy cập tenant khác | Chưa chạy |
| UAT-02 | Tenant admin | Chỉnh homepage và publish | Đúng logo/nội dung sau tải lại, preview không public | Chưa chạy |
| UAT-03 | Instructor | Tạo course/lesson và xuất bản | Chỉ người đủ quyền xem, thứ tự đúng | Chưa chạy |
| UAT-04 | Learner | Ghi danh, học, làm bài | Tiến độ và kết quả lưu đúng, không xem đáp án trái phép | Chưa chạy |
| UAT-05 | Owner | Chọn gói, thanh toán | Đối soát và quyền đúng, webhook lặp an toàn | Chưa chạy |
| UAT-06 | Operator | Xuất và khôi phục standalone | Dữ liệu đúng tenant, chạy trên môi trường sạch | Chưa chạy |

## Biên bản cần có

Release/commit, môi trường, dữ liệu giả, người thực hiện, thời gian, kết quả từng case,
bug còn lại, quyết định chấp nhận/từ chối và điều kiện xử lý. Demo kỹ thuật không thay UAT.
Dùng [mẫu nghiệm thu](../forms/acceptance.md).

Đối với scaffold hiện tại, anh có thể nghiệm thu việc chạy API admin local theo smoke script;
không dùng kết quả đó để tick các UAT sản phẩm phía trên.
