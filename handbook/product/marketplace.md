# Developer Portal và Marketplace

Trạng thái: phạm vi sản phẩm anh yêu cầu, chưa có portal, checkout hay payout.

## Vai trò và hành trình

Developer/seller tạo hồ sơ → tạo package → upload artifact/metadata → kiểm tự động → review →
publish listing/version → tenant mua/nhận entitlement → cài/kích hoạt → update/support.
Reviewer/platform admin tách quyền với seller; seller không tự duyệt, sửa version đã publish hay ký bằng khóa nền tảng.

## Catalog và vòng đời

Template gallery dùng chung nguồn package/version với marketplace; bản preview dùng dữ liệu giả,
không chạy plugin không tin cậy trong tenant thật. Listing có ảnh demo, loại, tương thích,
capabilities, SaaS/standalone/mobile support, giá/license, support và changelog.
Package release immutable; new version là artifact mới; states: draft → submitted → reviewing → approved/
rejected → published → suspended/withdrawn. Review audit lý do và người quyết định.

## Thương mại mục tiêu

Thanh toán order/payment khác entitlement (quyền dùng), download grant và installation.
Webhook phải xác thực/deduplicate, cấp entitlement đúng tenant/instance và phạm vi license.
Sổ cái doanh thu/commission/refund/payout có transaction, không cộng/trừ float hoặc cập nhật theo callback trùng.
Tỷ lệ chia, giá, thời gian hoàn tiền, chu kỳ payout và nhà cung cấp chưa quyết định.
Tách subscription YiEdu khỏi license extension để có thể xuất standalone theo điều khoản hợp lệ.

## Export và quyền sử dụng

Trước ZIP kiểm từng package có quyền redistributable/portable và instance đích.
Gói không được phép/không tương thích không bị bỏ âm thầm: báo blocker và lựa chọn thay thế/gỡ/đổi gói.
License hết hạn cần policy rõ cho quyền chạy hiện có và quyền nhận update; đề xuất không xóa data học tập,
không làm ngừng core learning offline chỉ vì registry marketplace mất kết nối.
Dữ liệu seller/payout/khách khác và khóa ký YiEdu không đi theo bản export.

## Quản lý chất lượng

Kiểm artifact provenance/signature, dependency, migration, tenant isolation, code review,
malware/supply-chain, quyền, performance và license. “Manifest hợp lệ” không thay các kiểm tra này.
Có báo cáo lỗi, cảnh báo bảo mật, thu hồi version và migration hỗ trợ khách đã cài;
không xóa artifact đang dùng mà không kế hoạch và audit.

## AC

- AC-023-01: seller submit template/component/plugin và theo dõi review; chỉ reviewer được publish.
- AC-023-02: webhook thanh toán lặp không tạo hai entitlement/hạch toán hai lần.
- AC-023-03: tenant chỉ tải/cài đúng version và phạm vi mua; seller không thấy data học viên.
- AC-023-04: refund/revoke/update policy có bằng chứng audit và xử lý instance đã export.
- AC-024-02: developer có docs/schema/example/test và báo lỗi tương thích trước publish.
