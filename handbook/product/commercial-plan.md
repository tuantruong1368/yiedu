# Kế hoạch kinh doanh, nguồn lực và ngân sách

Trạng thái: khung đánh giá, chưa có số liệu thị trường hay ngân sách được duyệt.

## Giả thuyết mô hình kinh doanh

Thuê bao theo gói cho hệ thống e-learning; dịch vụ triển khai độc lập và white-label có thể
thu phí riêng. Cần kiểm chứng khách hàng mua giá trị nào trước khi chốt đơn vị tính giá.
Không dùng số lượng học viên đơn thuần nếu chi phí video/AI biến động quá lớn.

## Đơn vị kinh tế cần đo

| Khoản | Dữ liệu phải thu thập |
|---|---|
| Doanh thu | Phí thực thu, hoàn tiền, chiết khấu, gia hạn |
| Hạ tầng | DB/compute nền, storage, video egress, log và backup |
| AI | Token/audio/job theo tenant, quota và chi phí thực tế |
| Phục vụ | Onboarding, hỗ trợ, vận hành và xử lý sự cố |
| Bản độc lập | Công xuất dữ liệu, triển khai, ký app, nâng cấp và hỗ trợ |

Lợi nhuận đóng góp theo tenant = doanh thu ròng − chi phí biến đổi phục vụ tenant.
Phân bổ chi phí nền và công phát triển riêng; chưa có giá trị đầu vào nên chưa tính lợi nhuận.

## Ước lượng công việc

Lập WBS theo capability → story → task; mỗi task ghi discovery/design/dev/test/review/deploy.
Ghi mức thấp/cơ sở/cao và giả định. Capacity là số giờ thực có của anh, không phải 24 giờ/ngày
của công cụ AI. Ước lượng lại sau sprint có dữ liệu; không hứa ngày trước khi biết phạm vi.

## Ngân sách cần quyết định trước khi tạo cloud

Hạn mức tháng, người chi trả, môi trường nào chạy liên tục, khu vực dữ liệu, chi phí cố định DB,
video/AI quota, cảnh báo và quy trình khi vượt ngưỡng. Budget alert không tự đảm bảo chặn mọi chi phí.
Chưa có quyền tạo dịch vụ trả phí chỉ từ việc đã chọn công nghệ.

## Trước khi bán

Xác định gói/dịch vụ, quyền dùng SaaS và code xuất, trách nhiệm dữ liệu/vận hành, cách hỗ trợ,
phạm vi nghiệm thu, nâng cấp và kết thúc dịch vụ. Chuẩn bị điều khoản và quy trình xử lý dữ liệu
với người có chuyên môn phù hợp trước thương mại; tài liệu này không phải hợp đồng.

## Cổng quyết định

Sau discovery: chọn nhóm khách hàng. Sau spike: chốt giải pháp. Sau pilot: review giá/chi phí.
Trước release: xác nhận ngân sách, phạm vi và khả năng hỗ trợ. Chưa đạt thì cập nhật backlog,
không tự bỏ qua cổng chỉ vì code chạy được.
