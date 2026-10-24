# Trạng thái triển khai 0.4 — authoring và đa ngôn ngữ

Cập nhật 24/10/2026. Mở rộng bản 0.3; không tuyên bố toàn bộ sản phẩm thương mại hoàn tất.
Hướng dẫn thao tác và SDK: [Authoring Studio](../guides/authoring-sdk.md).

| Yêu cầu | Triển khai hiện tại | Giới hạn |
|---|---|---|
| Việt/Anh | Cookie locale cho web, UI dictionary, ngôn ngữ nội dung page/lesson, mobile selector lưu SecureStore | Nội dung do tenant nhập cần tự biên dịch; không tự dịch bằng AI |
| Builder | GrapesJS, component/traits/style/layers, free/flow/fixed positioning, resize, zoom, viewport | Cần tự kiểm responsive cho absolute/fixed |
| Import | HTML/CSS tĩnh → component tree chỉnh sửa, API sanitize | Không chạy JS nhập vào, không tái tạo backend hay crawl mọi website |
| Logo | HTTPS/image nhúng nhỏ hoặc monogram từ chữ, màu và shape | Logo chữ thuật toán, không phải AI image generation |
| Gadget | 15 mẫu, event chính + tám event bổ sung, clone/delete/child/inspector | Form mẫu không gửi email/CRM; chưa có media storage |
| Page/menu | Tối đa 20 page, title/HTML/CSS VI/EN, menu liên kết page | SEO canvas iframe cần hoàn thiện thêm ngoài metadata SSR |
| Template/auth | Login chọn template vào builder trực tiếp; guest qua đăng ký | Social login chưa tích hợp |
| Tenant branding | Public/admin/learn dùng tenant logo, bỏ header/footer platform trong runtime tenant | App icon/store riêng chưa có |
| Rich lesson | Tiptap, bảng, ảnh, YouTube, code/checklist, KaTeX, callout và simulation | Native app hiện đọc text/video fallback; custom interactive node mới chạy web |
| Developer SDK | Registry gadget/tool và manifest editor_contributions, mẫu commercial metadata | Trusted build-time modules; chưa có tenant installer/checkout/license enforcement |
| AI | Có điểm tích hợp lesson tool, nút trạng thái chưa cấu hình | Chưa gọi AI provider |
| Dữ liệu | Alembic 0003, snapshot 0003; đọc snapshot 0002; giữ Puck legacy | Puck chuyển khi mở/lưu builder, không rewrite hàng loạt |

Các mục chưa làm của [bản 0.3](release-0.3.md) vẫn giữ trạng thái nếu bảng trên không thay thế.
Kết quả kiểm tra tại [verification](verification.md). Chưa UAT trên máy/thiết bị thật của chủ dự án hoặc production.
