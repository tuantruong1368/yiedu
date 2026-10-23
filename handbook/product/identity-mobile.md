# Identity, quản trị tenant và app YiEdu

Trạng thái: yêu cầu và thiết kế đề xuất, chưa tích hợp nhà cung cấp xác thực.

## Vai trò

Visitor, tenant owner/admin, instructor, learner, developer/seller, marketplace reviewer và platform admin.
Cùng một người có thể có nhiều vai trò qua membership; developer không tự có quyền vào dữ liệu tenant.
Mọi API kiểm quyền phía server. Tenant ID/hostname/email giống nhau không tự cấp quyền.

## Đăng ký và đăng nhập

Owner đăng ký trên YiEdu bằng Google/Facebook/email. Học viên đăng ký tại trang tenant; server
xác thực domain và gắn membership learner đúng tenant, không cấp admin theo URL hoặc email tùy ý.
Đề xuất một identity toàn nền tảng, membership nhiều tenant; provider cụ thể còn là ADR cần spike.
Google/Facebook/email-password có thể triển khai qua Firebase Auth/Identity Platform hoặc adapter khác.
Email cần verification, reset, rate limit; liên kết social account phải chứng minh sở hữu cả hai bên,
không tự ghép chỉ vì email trùng. Callback giữ state/nonce, code flow/PKCE theo loại client.
Token phải kiểm signature, issuer, audience, expiry và quyền; đăng xuất/thu hồi xử lý theo thiết kế provider.
Không đưa platform admin key hiện tại vào web/mobile.

## Trang quản trị

Trang quản trị tenant dùng đường dẫn `/administrator` trên domain của tenant.
Menu: dashboard, site/pages, branding/template, courses, lessons, learning paths, students,
assessments, extensions, updates, export và settings. Hiện/ẩn menu không thay kiểm quyền API.
Owner cấp quyền cho instructor; instructor không được cài code, export dữ liệu toàn tenant hay quản lý billing.
Soạn bài: text/video/tài liệu/quiz, draft/revision/publish, prerequisite; AI hỗ trợ có review của giảng viên.

## Lộ trình học

Learning path gồm khóa học/bài theo thứ tự, điều kiện tiên quyết và quy tắc hoàn thành.
Cấm vòng lặp prerequisite; sửa path có version, cần quy tắc áp dụng cho learner đang học.
Đăng ký tài khoản không tự ghi danh vào mọi khóa trả phí/private. Tiến độ server authoritative,
idempotency khi app retry; người học không tự gửi trạng thái “đã đỗ” để mở bước kế tiếp.

## App iOS/Android dùng chung

Đăng nhập → lấy danh sách membership → chọn tenant → học theo path. Link/QR từ tenant chuyển
app tới tenant đúng qua universal/app links đã xác minh; web fallback khi chưa cài app.
App dùng schema khóa học/lộ trình từ API, không chạy Puck React DOM thành giao diện native.
Plugin web không tự thành tính năng mobile: package khai báo mobile capability; thay đổi native
cần release app. Không tải/chạy Python hoặc native binary tùy ý trong app.

## Sau khi export standalone

Account SaaS và standalone là hai security domain. Đề xuất app hỗ trợ “thêm hệ thống” qua QR/config
HTTPS đã xác minh ownership, API version và auth issuer. Không nhận API base URL từ link tùy ý,
không gửi token SaaS sang server khách hàng. Đăng nhập lại/di chuyển tài khoản theo kế hoạch identity.
Localhost của điện thoại không là Mac của anh; thử local mobile cần endpoint có thể truy cập và cấu hình dev.
Tương thích app chung với standalone là spike bắt buộc, chưa được chứng minh; app riêng là lựa chọn bổ sung.

## AC

- AC-018-01: owner CRUD course/lesson/path trong tenant; instructor bị chặn thao tác vượt quyền.
- AC-018-02: prerequisite có vòng lặp bị từ chối; learner chưa đạt không mở được bước bị khóa.
- AC-019-01: learner tạo account tại A, đăng nhập app thấy membership A và tiến độ đúng.
- AC-019-02: chuyển tenant/logout không giữ dữ liệu/cache/token sai tenant; đăng ký không tự mua course.
- AC-019-03: endpoint standalone phải được xác minh và login với issuer đích, không dùng lại token SaaS.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.
