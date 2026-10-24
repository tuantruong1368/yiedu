# Chạy và review sản phẩm 0.4

Builder, VI/EN và lesson tools mới: [Authoring Studio/SDK](authoring-sdk.md).
Máy đã chạy bản cũ cần sao lưu và xem mục nâng local trong hướng dẫn này trước khi bật stack mới.

## Cách khởi động

Từ gốc repo, Docker Desktop đang chạy:

```bash
python3 scripts/bootstrap.py
docker compose up --build -d
docker compose ps
```

Mở http://localhost:3000. Compose chạy migration trước API. Không cần seed hay tài khoản mật khẩu cố định.
Nếu muốn sửa code có hot reload, theo cách venv + npm trong README.

## Kịch bản chủ hệ thống

1. Chọn Academy/Studio/Future Lab. Guest đăng ký email; user đang login vào builder trực tiếp.
2. Guest tạo workspace tại dashboard; user đang login có workspace mặc định. Trong builder sửa tên/slug,
   kéo/sửa gadget, page/menu/logo và hai ngôn ngữ, lưu nháp rồi xuất bản.
3. Xem `/t/<slug>`, mở `/t/<slug>/administrator` bằng tài khoản owner.
4. Tạo course, mô tả, chọn xuất bản. Bấm Bài học, thêm tiêu đề/nội dung/URL video HTTPS trực tiếp.
5. Tạo lộ trình theo thứ tự course; chỉnh sửa lộ trình. Các prerequisite vòng lặp bị từ chối.
6. Bật first-party certificate/activity log nếu cần; xem thành viên và audit.

## Kịch bản học viên

Dùng cửa sổ riêng tư hoặc trình duyệt khác để không dùng nhầm session owner.
Vào trang tenant → tham gia → đăng ký email → join tenant → ghi danh free course.
Đọc bài, mở direct video nếu có, đánh dấu hoàn thành. Khóa học sau trong path cần hoàn thành khóa trước.
Có nhiều path thì các prerequisite được kết hợp; course trước chưa có lesson chưa được xem là hoàn thành.
Chứng nhận là bản nội bộ có reference, không phải chứng chỉ được tổ chức khác xác thực.

## Chạy ở hostname tenant

`<slug>.localhost:3000` được Next proxy route về tenant; browser/OS phải hỗ trợ localhost wildcard.
Cookie host-only: có thể phải đăng nhập lại trên hostname khác; không chia cookie toàn domain.
Fallback `/t/<slug>` luôn dùng được ở local. `yisoft.yiedu.vn` cần DNS/TLS/gateway thực tế, repo chưa tạo.

## Export

Owner mở Quản trị → Xuất hệ thống → tải ZIP. File có snapshot đúng tenant và source web/API.
Không có auth session/password hash; khi restore sinh mật khẩu mới. URL video ngoài không được tải vào gói.
Theo [restore guide](standalone-local.md), không nhập snapshot vào database đang chứa dữ liệu cần giữ.

## Lỗi và giới hạn

DB unhealthy: xem log DB/credential/port. API lỗi key: thay placeholder trong .env, khởi động lại.
401: login lại; 403: kiểm membership/role/ghi danh/prerequisite; 409: slug/revision xung đột.
Trường Video HTTPS riêng cần URL media trực tiếp; YouTube được chèn bằng công cụ Tiptap trong nội dung.
Chưa có video ingestion/storage service.
Đăng nhập Google/Facebook đang disabled; không có callback giả hoặc thanh toán giả.
