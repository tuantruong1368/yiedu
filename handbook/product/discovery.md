# P1 — Kế hoạch khám phá khách hàng

Trạng thái: chưa phỏng vấn khách hàng thật. Các nhóm và vấn đề bên dưới là giả thuyết.

## Nhóm cần kiểm chứng

| Nhóm | Công việc muốn hoàn thành | Điều cần hỏi |
|---|---|---|
| Giảng viên độc lập | Mở lớp trực tuyến với thương hiệu riêng | Có sẵn học viên không, ai quản trị? |
| Trung tâm đào tạo | Tổ chức nhiều khóa/lớp và quản lý tiến độ | Có bao nhiêu nhân sự, đang dùng gì? |
| Doanh nghiệp | Đào tạo nội bộ, theo dõi hoàn thành | Cần SSO, báo cáo, bảo mật ở mức nào? |

## Kịch bản phỏng vấn

1. Lần gần nhất anh/chị tổ chức đào tạo như thế nào?
2. Bước nào mất thời gian hoặc phát sinh lỗi? Cho một ví dụ thật.
3. Đang trả tiền cho giải pháp nào, ai phê duyệt chi phí?
4. Hệ thống thương hiệu riêng giải quyết việc gì mà công cụ hiện tại chưa làm được?
5. Dữ liệu nào không được đưa lên nền tảng dùng chung?
6. Khi nào thật sự cần xuất hệ thống riêng? Ai vận hành sau đó?
7. App riêng là điều bắt buộc hay app dùng chung đã đủ? Vì sao?
8. Có thể tham gia thử một luồng thực tế và phản hồi không?

Tránh hỏi dẫn dắt “anh/chị có thích YiEdu không”. Tìm hành vi đã xảy ra và chi phí hiện tại.

## Bằng chứng và đầu ra

Ghi bằng [mẫu phỏng vấn](../forms/interview.md), ẩn thông tin cá nhân khỏi repo public.
Nhóm nhu cầu theo tần suất, mức đau, khả năng trả tiền, công sức phục vụ.
Đề xuất nhóm ưu tiên dựa vào bằng chứng; chưa coi phản hồi một người là đại diện toàn thị trường.
Giá, số khách và tỷ lệ chuyển đổi chưa được xác nhận.

## Journey dự kiến

Tìm hiểu → xem demo → đăng ký → tạo hệ thống → thiết lập trang → tạo khóa học →
mời học viên → học thử → chọn gói → vận hành hoặc yêu cầu tách riêng.
Theo dõi điểm bỏ dở mỗi bước sau khi có người dùng thật.

## Journey v0.2 và câu hỏi khám phá bổ sung

Journey hiện hành ở [vision](vision-v2.md), thay luồng tổng quát phía trên bằng template-first onboarding.
Yêu cầu nền tảng đã được chủ sản phẩm xác định; discovery kiểm chứng ưu tiên/trải nghiệm và giá trị thị trường.
Hỏi thêm: mẫu nào cần trước, quản trị lộ trình ra sao, vì sao phải export, ai vận hành server riêng,
app chung có đủ không, có cần dùng app sau export, tiện ích nào sẵn sàng trả tiền,
ai phát triển và hỗ trợ extension, chính sách auto-update/maintenance nào chấp nhận được.
