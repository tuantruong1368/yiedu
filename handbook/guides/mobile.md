# App YiEdu iOS/Android

Mã nguồn React Native + Expo tại `mobile/`. Dùng API/session chung, chọn tenant qua memberships.
Tài khoản học viên phải được tạo/tham gia tại website tenant trước.

## Chạy dev

Cần Node.js 26.12.1, Expo Go tương thích SDK trong package.json hoặc development build phù hợp.

```bash
cd mobile
npm ci
npm run start
```

Nhập origin API tin cậy, ví dụ `https://api.example.com` (không thêm `/api/v1`).
Đăng nhập email → chọn hệ thống → course/path → bài học/video → lưu completion.
Token lưu SecureStore cùng origin; không tự chuyển token giữa các server. Đổi server bằng logout/login.
Không coi bước nhập origin thủ công là discovery/federation tự động đã hoàn thiện.

## Local với điện thoại

Localhost trên điện thoại là chính điện thoại. Cần API qua LAN hoặc HTTPS tunnel được anh cấu hình.
Compose mặc định chỉ bind loopback để không mở DB/API ra LAN ngoài ý muốn.
Nếu dùng LAN HTTP trong môi trường dev riêng: cấu hình bind API phù hợp, `.env` trong mobile
đặt `EXPO_PUBLIC_ALLOW_HTTP_DEV=true`, và nhập đúng origin máy chủ. Không mở PostgreSQL cho điện thoại.
Địa chỉ/credential phát triển không commit. Bản production chỉ dùng HTTPS.

## Kiểm tra và đóng bundle

```bash
npm run typecheck
npx expo export --platform android --platform ios --output-dir ../.build/mobile
```

Bundle thành công không tạo APK/IPA hay chứng minh app chạy trên thiết bị thật.
Signing, provisioning, app store account và build native cần thiết lập riêng.
Chưa đăng ký/đẩy app lên store hoặc tạo tài nguyên trả phí.

## Đa ngôn ngữ từ 0.4

Bộ chọn Việt/English lưu locale trong SecureStore. Khi đang trong tenant, app hiển thị tên tenant;
lesson dùng bản dịch text nếu có. Công cụ tương tác/math rich node hiện render trên web, native giữ
text/video fallback; chưa có generic native tool host. Xem [authoring SDK](authoring-sdk.md).
