# YiEdu 0.9 — Quản trị, AI và thương mại

Ngày triển khai mã nguồn: 25/10/2026. [Hướng dẫn vận hành](../guides/platform-commerce-ai.md).
Phạm vi thương mại mới dùng cấu hình do chủ hệ thống nhập; chưa có giao dịch merchant thật,
AI provider thật hoặc triển khai production được thực hiện trong lượt này.

| Yêu cầu | Kết quả chạy được | Giới hạn |
| --- | --- | --- |
| Logo YiEdu mới | SVG sách mở + mầm Y + điểm sáng, header/favicon/wordmark | Chưa đăng ký bảo hộ thương hiệu |
| Nền hero | Full-width, nội dung có giới hạn đọc, mobile không tràn ngang | Chưa pilot thiết kế với người dùng thật |
| Sửa/xóa hệ thống/thiết kế | Mở Website Studio, archive/restore, ACL owner | Archive là xóa mềm, slug vẫn giữ |
| Quản trị YiEdu | Role qua server console, `/platform`, appearance VI/EN, template CRUD, tenant/trial/plans/invoices/audit | Cần cấp quyền tài khoản thật trên máy đang vận hành; không có mật khẩu mặc định |
| Template chỉnh sửa | DB override, Website Studio, curriculum/Tiptap, import/export, draft/published/archive | Không ghi đè tenant đã tạo; chưa có marketplace bán template |
| AI tạo template/khóa | Responses API strict schema, key mã hóa, quota, lịch sử, duyệt/apply idempotent, slide/mô phỏng | Test provider bằng mock; API key riêng, chưa ChatGPT OAuth thương mại; chưa worker durable |
| Miễn phí/khóa lẻ/combo | Offer VND/USD, paid-gate, snapshot combo, kiểm prerequisite, đơn/CSV | Chưa voucher, affiliates, VAT/e-invoice hoặc partial refunds |
| PayPal/MoMo | Adapter tạo đơn, capture/query/IPN/chữ ký, receiver/amount/currency checks | Cần merchant, public HTTPS/webhook, sandbox/live UAT; chưa gửi tiền thật |
| Ngân hàng | Hướng dẫn nhận tiền, mã chuyển, đối soát admin, transaction uniqueness | Chưa đọc sao kê tự động/VietQR động |
| Hoàn tiền | Ghi chứng từ hoàn đủ đã thực hiện, audit, thu hồi quyền do đơn cấp | Không thực hiện chuyển tiền; chưa dispute/chargeback tự động |
| Phí tenant | Trial 30 ngày, 3 gói, tháng/năm trả trước, renewal idempotent, quota, giá/hạn mức snapshot | Giá là đề xuất thử thị trường; chưa auto-debit, prorate hoặc email dunning |
| Hết hạn | Dừng authoring/new enrollment/sales, giữ dữ liệu/học viên đã học/export, tạo mới phải kích hoạt | Email verification/reset, RLS và hardening production chưa hoàn thành |
| Nâng cấp | Migration 0006, backfill trial tenant cũ, export snapshot 0006 và restore tương thích bản trước | Không export secrets, platform roles, lịch sử payment hoặc OAuth credentials |
| Mobile | Nhận metadata khóa có phí, giữ học nội dung đã cấp quyền, không gọi ghi danh miễn phí sai | Chưa mua trong app hoặc thử thiết bị thật |

## Bằng chứng

- Test API và browser tại [verification](verification.md); bằng chứng CI sẽ gắn với commit nguồn.
- Không coi mock provider là chứng minh thanh toán sandbox/live thật.
- Không tự tạo/gán tài khoản quản trị production, không truy cập máy Mac của chủ hệ thống.
- OpenAI API và tài khoản nhận tiền do người vận hành kết nối sau khi nâng cấp.

## Lưu ý dữ liệu

Các migration cũ giữ nguyên. Migration 0006 chứa DDL đóng băng, không import model hiện tại.
Cấp role thu hồi session cũ. Key mã hóa được giữ qua bootstrap; backup key riêng.
Có thể archive/restore tenant và thiết kế; không xóa khóa có lịch sử đơn.
Giữ Puck legacy, validator SiteDocument/lesson, snapshot Studio, revision/fingerprint và ACL tenant.
