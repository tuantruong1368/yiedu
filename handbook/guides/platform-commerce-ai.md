# Quản trị YiEdu, AI và thương mại 0.9

Bản này bổ sung quản trị nền tảng bằng session, template có thể sửa, AI tạo bản nháp,
bán khóa/combo và hóa đơn phí tenant. Đây là mã nguồn chạy local có adapter tích hợp;
chưa kết nối tài khoản merchant/OpenAI thật hoặc triển khai production.

## Nâng cấp và cấp quyền chủ nền tảng

Backup database trước khi nâng cấp, giữ nguyên `.env` và named volume.
Trong thư mục repo trên máy đang chạy YiEdu:

```bash
git switch main
git pull --ff-only origin main
python3 scripts/bootstrap.py
docker compose up --build -d
```

Bootstrap bổ sung `CONNECTIONS_ENCRYPTION_KEY` nếu thiếu, giữ mật khẩu DB/admin key cũ.
API nhận khóa này qua Compose. Không in khóa, không commit `.env`, không tạo lại khóa sau khi
đã lưu kết nối. Backup khóa cùng cấu hình máy chủ theo kênh riêng; mất khóa sẽ mất khả năng giải mã.
Đổi khóa cần giải mã/mã hóa lại các kết nối và snapshot gateway trong đơn đang chờ,
không chỉ sửa `.env`.

Tạo tài khoản bằng email của chủ YiEdu trên web nếu chưa có. Sau khi người vận hành đã xác minh
chủ tài khoản, chạy trên máy chủ (thay email ví dụ bằng email đã chỉ định):

```bash
docker compose exec api python scripts/provision_platform_admin.py --email owner@example.com
```

Sau đó đăng nhập lại và mở `/platform`. Công cụ thu hồi session cũ khi cấp/thu hồi quyền.
`--revoke` thu hồi quyền. Không có mật khẩu mặc định, không tự tạo tài khoản đặc quyền và
không tự cấp quyền khi người dùng đăng ký một email. Quyền nằm trong `users.platform_admin`.
Không đưa `ADMIN_API_KEY` lên trình duyệt/mobile. Email recovery/verification vẫn là công việc
riêng cần làm trước mở đăng ký công khai ở production.

## Logo và trang chủ

Logo SVG gồm sách mở (tri thức), chữ Y như mầm cây (phát triển theo hướng riêng) và điểm sáng
vàng (ý tưởng mới). Có biểu tượng vuông cho header/favicon và bản chữ ở `web/public/brand/`.
Nền hero chạy hết chiều ngang; phần nội dung có giới hạn đọc, mock website vẫn hiển thị website
thật. Header, hero và bảng giá có bố cục riêng cho mobile.

Trong **Giao diện YiEdu** có tên, URL logo, màu thương hiệu/nền hero, nội dung Việt/Anh,
website minh họa và bật/tắt bảng giá. Màu nhận hex, logo dùng asset đóng gói hoặc HTTPS;
không nhận CSS/script tùy ý. Lưu có revision để tránh ghi đè bản đã sửa ở cửa sổ khác.
Nếu mẫu minh họa bị ẩn, trang chủ chọn một mẫu đang xuất bản làm dự phòng.

## Hệ thống, bản thiết kế và thùng rác

Dashboard có **Chỉnh sửa website**, **Xóa hệ thống**, **Xóa bản thiết kế** và **Thùng rác**.
Xóa ở đây là archive có thể khôi phục; không xóa cứng DB. Chỉ owner archive hệ thống;
owner của bản thiết kế archive thiết kế đó. Admin tenant có thể mở thiết kế website của tenant.
Archive thiết kế không xóa website đã xuất bản. Archive hệ thống tạm ẩn website công khai.
Khôi phục giữ khóa học, tiến độ, đơn hàng và các liên kết cũ. Slug vẫn được giữ, tránh tái sử dụng
địa chỉ đang có người học hoặc giao dịch.

## Template do YiEdu quản lý

**Thư viện template** hỗ trợ tìm, tạo bản sao, sửa thông tin/nhóm, Website Studio đa trang,
khóa học/bài học, nhập/xuất JSON, nháp/xuất bản/archive. Bài giảng dùng lại editor Tiptap,
có nội dung Việt/Anh, video URL và các snapshot Studio đã có. Sửa thiết kế bằng Website Studio,
nhấn **Áp dụng template**, quay lại đúng template. Nút lưu nháp của builder vẫn chỉ lưu thiết kế.

Bundled templates được override bằng DB; không sửa file mẫu khi vận hành. Template nháp/archived
không có trong catalog công khai. Các website/khóa học đã tạo là bản sao riêng, giữ nguyên khi
mẫu thay đổi. Template mới được copy curriculum vào tenant trong một transaction lần xuất bản đầu.
Ngừng mở bán hoặc bỏ xuất bản nội dung có lịch sử đơn thay cho xóa cứng khóa đã có giao dịch.

## OpenAI API và AI Studio

Owner cấu hình **Kết nối → OpenAI API** cho tenant; quản trị YiEdu cấu hình scope platform.
Điền API key, model hỗ trợ Structured Outputs, giới hạn lượt/ngày và token đầu ra.
Mặc định `gpt-4o-mini` để bắt đầu, có thể thay model được cấp quyền trong tài khoản API.
Khóa được mã hóa Fernet và không hiển thị lại trong GET, audit, ZIP hoặc frontend bundle.
Để trống trường secret khi lưu sẽ giữ khóa; **Ngắt kết nối** xóa khóa đang dùng cho kết nối.
Các đơn thanh toán đang chờ vẫn giữ snapshot gateway mã hóa để đối soát sau khi ngắt.

Đây là kết nối **API key**, không phải nút đăng nhập trực tiếp bằng tài khoản ChatGPT.
Phí sử dụng API do OpenAI tính theo tài khoản API đã kết nối. Tài liệu OpenAI hiện phân biệt
API với ChatGPT plan usage/OAuth; tích hợp website thương mại bằng OAuth cần quyền tham gia phù hợp.
Không dùng cookie ChatGPT hoặc access token không dành cho tích hợp này.

Quản trị platform có thể tạo website template kèm 1–4 khóa học hoặc tạo một khóa để thêm vào
mẫu đã chọn. Owner/admin/instructor tenant tạo khóa học của tenant. Mỗi khóa có 2–8 bài;
đây là giới hạn lượt tạo có chủ đích, có thể bổ sung nhiều lần.

Luồng: mô tả người học/mục tiêu → gọi Responses API với JSON schema strict và `store=false` →
kiểm schema → lưu bản nháp → đọc ví dụ/bài tập/đáp án → **Đã duyệt · Lưu bản nháp** →
chỉnh bằng editor → xuất bản. Chưa duyệt không tạo khóa/template công khai. Áp dụng lặp không
nhân đôi nội dung. Khóa AI thêm slide và mô phỏng first-party khi phù hợp; không bịa video URL.
Nội dung ngôn ngữ nào thì tạo theo ngôn ngữ đó, không tự gọi nội dung một ngôn ngữ là bản dịch
đã được kiểm duyệt của ngôn ngữ khác. Có thể biên tập ngôn ngữ còn lại trong editor.

Giới hạn theo UTC ngày, chung cho scope/tenant, lấy mức nhỏ hơn giữa cấu hình kết nối và gói.
Xóa bản nháp không đặt lại lượt. Lần lỗi cũng tiêu thụ một reservation để tránh retry phát sinh
phí không kiểm soát. Hệ thống không tự retry yêu cầu sinh nội dung có phí. Lịch sử giữ trạng thái
để quay lại sau khi điều hướng; job đồng bộ có timeout, chưa có worker hàng đợi bền vững.
Bản nháp đang chạy quá 5 phút có thể xóa để dọn trạng thái, không giả báo đã tạo xong.

## Bán khóa học và combo

Trong **Bán khóa học**, chọn khóa hoặc lộ trình đã xuất bản, chọn miễn phí/trả phí,
đặt giá VND và giá USD cho PayPal. VND là đơn vị đồng, USD lưu theo cent; không dùng float tiền.
Có thể để 0 tại đồng tiền chưa bán, tạm ngừng đăng ký/mở bán mới và tải CSV đơn hàng.
Combo chốt danh sách khóa tại lúc tạo đơn; sửa lộ trình sau đó không làm mất phần khách đã mua.
Điều kiện tiên quyết vẫn áp dụng sau khi trả tiền, không bỏ qua cấu trúc học.

- Không có offer: khóa học mặc định miễn phí, giữ tương thích bản trước.
- Khóa trả phí: API ghi danh miễn phí trả 402, không trả nội dung bài trước khi cấp quyền.
- Combo miễn phí được người bán cấu hình rõ ràng: cho ghi danh tất cả khóa trong combo.
- Lộ trình chưa cấu hình combo: không mở miễn phí các khóa lẻ đang bán.
- Học viên đã ghi danh từ thời điểm miễn phí vẫn giữ quyền khi bên bán đổi giá.

**Kết nối nhận tiền** của tenant chỉ owner sửa được. Tenant sử dụng tài khoản PayPal Business,
MoMo merchant hoặc tài khoản ngân hàng của chính bên bán. YiEdu không gom tiền khóa học rồi
payout, không tự đăng ký merchant và không lưu số thẻ/CVV. Phí cổng thanh toán do nhà cung cấp thu.
Tiền dùng thử/gói dịch vụ tenant đi qua kết nối **platform**, tách với tiền học viên.

### PayPal

Cấu hình sandbox/live, client ID, client secret, merchant ID nhận tiền. Tạo Orders v2 rồi chuyển
sang URL approve/payer-action của PayPal. Khi học viên quay lại, backend query/capture với request ID
ổn định, kiểm trạng thái, số tiền, USD, custom order ID và merchant trước khi cấp quyền.
Có nút **Kiểm tra thanh toán** và lịch sử đơn để đối soát lại khi trình duyệt bị đóng.

Nếu dùng webhook, đăng ký URL hiển thị trong kết nối với PayPal, điền webhook ID và đăng ký
`PAYMENT.CAPTURE.COMPLETED`. Chữ ký được xác minh bằng API PayPal; nội dung callback không tự
được tin là bằng chứng số tiền. Backend query đơn PayPal trước khi ghi paid.

### MoMo Việt Nam

Cấu hình sandbox/live, partner code, access key, secret key. Dùng captureWallet v2,
request/IPN HMAC-SHA256, kiểm partner/request/order/amount/transId. Return URL chỉ cập nhật UI;
chỉ IPN đúng chữ ký hoặc query server xác nhận thành công mới cấp quyền. IPN replay không tạo
thêm quyền. URL callback phải truy cập được từ MoMo; localhost thường cần môi trường thử/tunnel
được cấu hình đúng, không thể nhận IPN từ Internet chỉ bằng chạy localhost.

### Ngân hàng

Hiển thị ngân hàng, số tài khoản, chủ tài khoản, số tiền và nội dung `YI` + mã đơn.
Học viên tự chuyển. Owner/admin tenant đối chiếu sao kê thật, nhập transaction ID và số tiền,
ghi chú rồi xác nhận. Không có API đọc sao kê tự động hoặc VietQR động trong bản này.
Học viên không được gọi API xác nhận tiền. Một transaction không được gán cho hai đơn.
Đơn cũ được đối soát thủ công nếu thực tế tiền đến sau hạn; cần kiểm tra đúng tài khoản nhận.

### Trạng thái và hoàn tiền

Đơn lưu giá/currency, danh sách khóa và tài khoản nhận tại thời điểm tạo, idempotency key,
hạn 24 giờ và giao dịch đã đối soát. Callback đã xác minh đến muộn vẫn được đối soát, kể cả
học viên đã hủy local; hủy local không thể hủy một khoản tiền nhà cung cấp đã thu.
Lỗi tạo gateway vẫn giữ đơn để kiểm tra/retry cùng ID, tránh mất dấu một giao dịch timeout.

**Ghi nhận hoàn tiền** chỉ dùng sau khi người bán đã hoàn đủ tiền qua nhà cung cấp/ngân hàng.
Đây là thao tác ghi chứng từ, không thực hiện chuyển tiền. Ghi lại số tiền và mã hoàn tiền,
audit người thao tác; thu hồi quyền học được tạo bởi đơn đó, giữ tiến độ và quyền từ nguồn khác.
Với hóa đơn YiEdu chỉ hoàn kỳ mới nhất có trạng thái khớp; cần đối soát các kỳ tiếp theo trước.
Chưa có self-service refund, partial refunds, dispute/chargeback tự động, e-invoice thuế hoặc
đối soát statement định kỳ bằng worker. Cần quy trình vận hành và UAT merchant trước thu tiền thật.

## Thu phí tenant

Gói khởi điểm do YiEdu đề xuất để kiểm chứng thị trường, không phải số liệu đã được pilot:

| Gói | Mỗi 30 ngày | PayPal | Khóa học mới tối đa tổng | Học viên | AI/ngày |
| --- | ---: | ---: | ---: | ---: | ---: |
| Starter | 299.000 VND | 12 USD | 10 | 100 | 10 |
| Growth | 799.000 VND | 32 USD | 50 | 1.000 | 30 |
| Scale | 1.990.000 VND | 80 USD | 200 | 5.000 | 100 |

Thử **30 ngày** bắt đầu khi xuất bản lần đầu, dùng hạn mức Growth, không yêu cầu thẻ.
Các tenant cũ nhận 30 ngày từ migration; không xóa dữ liệu hay ghi nhận đã thu tiền.
Tenant tạo lại trong cùng tài khoản dùng chung mốc thử, không reset 30 ngày. Sau khi mốc đã hết,
tạo tenant mới đưa vào trạng thái chờ kích hoạt: trả gói, quay lại bản thiết kế rồi xuất bản;
không xuất bản miễn phí bằng cách tạo lại tenant.

Gói năm: trả 10 tháng, dùng 365 ngày; gói tháng 30 ngày. Không tự trừ tiền, không tự nâng gói.
Gia hạn cùng gói cộng tiếp thời gian. Chọn gói khác khi kỳ đã hết; chưa có prorated upgrades.
Giá và hạn mức chỉnh tại **Khách hàng & gói**. Giá/hạn mức đơn và kỳ đã trả được chốt trong
snapshot; thay bảng giá không sửa ngược kỳ đang dùng. Nội dung có sẵn vượt hạn mức vẫn giữ,
chỉ ngăn tạo thêm khi đạt quota. Đếm học viên là membership learner của tenant, không phải MAU.

Hết hạn: chặn authoring, xuất bản, AI, bán/ghi danh mới; vẫn cho quản trị đọc dữ liệu, cấu hình
thanh toán/gia hạn, export và học viên đọc/hoàn thành nội dung đã ghi danh. Không tự archive.
Quản trị platform có thể gia hạn thử 1–90 ngày mỗi thao tác với lý do và audit.
Standalone export không bắt trả phí SaaS; người vận hành tự cấu hình lại merchant/API.

Nên đo kích hoạt (xuất bản + khóa có 1 bài), lần nhận học viên, chuyển đổi trial→paid,
churn/renewal, chi phí hỗ trợ và biên vận hành trước điều chỉnh giá. Nghiên cứu tham chiếu ngày
25/10/2026: Thinkific dùng gói theo quy mô, Teachable phân tầng sản phẩm/tính năng/phí giao dịch.
Chọn 30 ngày cho YiEdu để khách đủ thời gian xây nội dung; chưa khẳng định đây là tối ưu thực nghiệm.
Không gửi email tự động do chưa có email delivery và chưa được cấu hình gửi thư.

## Truy vết và kiểm chứng

Migration `0006`, [phạm vi 0.9](../product/release-0.9.md),
[CR-007](../product/changes/CR-007-platform-commerce-ai.md).
Test API gồm ACL, mã hóa/redaction, revision, giá và combo snapshot, paid-gate, replay,
trial/renewal, archive và AI review/idempotency. Browser kiểm desktop/mobile, dashboard,
người bán cấu hình giá/ngân hàng, học viên checkout, quản trị đối soát, học viên mở bài;
platform sửa giao diện và Website Studio của template. API OpenAI/PayPal/MoMo được mock trong test,
không phát sinh phí hoặc giao dịch thật. CI PostgreSQL là kiểm chứng JSONB/FK/migration thực.

## Tài liệu chính thức tham khảo

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [OpenAI Sign in with ChatGPT: phạm vi tích hợp](https://developers.openai.com/siwc/quickstart)
- [PayPal Orders v2](https://developer.paypal.com/api/orders/v2)
- [PayPal verify webhook](https://developer.paypal.com/api/webhooks/v1/verify-webhook-signature-post)
- [MoMo one-time wallet payment](https://developers.momo.vn/v3/docs/payment/api/wallet/onetime/)
- [MoMo query](https://developers.momo.vn/v3/docs/payment/api/payment-api/query/)
- [Fernet](https://cryptography.io/en/latest/fernet/)
- [Thinkific pricing](https://www.thinkific.com/pricing/)
- [Teachable pricing](https://www.teachable.com/pricing)
