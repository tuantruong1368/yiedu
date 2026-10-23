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

## UAT v0.2 — không thay đổi kết quả cũ

| ID | Vai trò | Kịch bản và điều kiện đạt | Trạng thái |
|---|---|---|---|
| UAT-07 | Owner | Chọn mẫu → Google/FB/email → builder giữ mẫu → publish subdomain có homepage/admin | Chưa chạy |
| UAT-08 | Admin/instructor | Soạn bài, sửa course/path, đúng role và prerequisite | Chưa chạy |
| UAT-09 | Learner | Đăng ký tại tenant, login app iOS/Android và học đúng path/progress | Chưa chạy |
| UAT-10 | Owner/operator | Tải ZIP, setup local/server sạch, kiểm data/media/auth/app endpoint | Chưa chạy |
| UAT-11 | Operator | Update patch có policy; giữ nội dung, lỗi thì recovery có bằng chứng | Chưa chạy |
| UAT-12 | Tenant admin | Mua/cài/bật/tắt/gỡ extension; quyền và data đúng | Chưa chạy |
| UAT-13 | Developer/reviewer | Submit/review/publish/sell version; entitlement và audit đúng | Chưa chạy |

Mỗi case gắn AC tương ứng trong [truy vết](traceability-v2.md), ghi build/môi trường/người thực hiện.
