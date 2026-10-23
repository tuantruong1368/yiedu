# FR-020 — ZIP hệ thống độc lập

Trạng thái: đặc tả v0.2, chưa có exporter/installer. Bấm ZIP là trải nghiệm mục tiêu sau khi khách ưng ý.

## Kết quả phải có

Khách tải ZIP có homepage, trang quản trị, backend, schema/data/media của tenant và hướng dẫn
chạy local hoặc server. Đây là ứng dụng cần runtime/database; không phải file HTML mở trực tiếp.
Đề xuất gói có Docker Compose và CLI setup; phải kiểm trên Mac M1 và Linux trước nghiệm thu.

| Đường dẫn dự kiến trong ZIP | Nội dung |
|---|---|
| runtime/ | Source/build được phép của FastAPI và web/admin renderer |
| database/ | Schema migrations, snapshot đúng tenant, mapping/checks |
| media/ | File được phép kèm checksum, remap object keys |
| packages/ | Template/component/plugin portable đúng version/license |
| config/ | Env mẫu và config branding/page, không chứa secret SaaS |
| deployment/ | Compose/manifests, installer/updater được ký và version |
| export-manifest.json | Phiên bản core/API/schema, file checksum, số bản ghi, phụ thuộc và quyền |
| README.md | Preflight, setup, auth, restore, endpoint mobile, backup và update |

Đây là layout đề xuất, chưa là ZIP có thể tải thật. App binary/signing key không mặc định nằm trong ZIP.
Một app YiEdu dùng chung là yêu cầu chính; app white-label riêng là đường bổ sung.

## Pipeline

Authorize owner/entitlement → khóa snapshot nhất quán → kiểm dependency/license/portability →
export dữ liệu và file → build/assemble → ký manifest/checksum → restore sandbox → phát link tải private có hạn.
Job bất đồng bộ có idempotency và audit. Không báo ready trước khi kiểm gói thành công.
Tùy chọn dừng ghi/cutover phải chốt cho từng lần export. Snapshot không tự đồng bộ thay đổi phát sinh sau đó;
không có replication hai chiều hoặc import-back ngầm sau tách.

## Installer môi trường đích

Preflight runtime/dung lượng/DB/network → kiểm chữ ký/checksum → nhập config riêng → restore DB/media →
chạy migration cần thiết một lần → cấu hình auth/email/storage → tạo/reset admin theo thủ tục → smoke → ready.
Không nhúng `.env` SaaS, private keys, global admin key, seller finance hoặc data tenant khác.
Identity provider Google/Facebook phải đăng ký callback cho domain mới; provider phải có credential riêng
hoặc federation được cấu hình. Không hứa di chuyển password nguyên trạng giữa mọi nhà cung cấp.
Core có email/local login khả dụng theo adapter đã triển khai, không phụ thuộc auth SaaS để học offline.

## Extension và app sau tách

Portable package phải có quyền redistribution/runtime. Package không portable/license thiếu thì báo blocker,
không âm thầm bỏ chức năng. Updater local đăng ký instance và policy với YiEdu nếu admin cho phép.
Core learning không gọi Control Plane để quyết định được học sau tách; update/marketplace/AI cần mạng riêng.
App chung phải discover endpoint mới, kiểm issuer/API compatibility và đăng nhập lại theo [thiết kế](identity-mobile.md).
Đây là spike chưa chứng minh; không hứa token/account tự hoạt động ở mọi server mới.

## AC

- AC-020-01: giải nén và setup trên local/server sạch, homepage/admin/course/path/progress đúng snapshot.
- AC-020-02: retry job cùng key không xuất sai/multiple snapshot; gói thiếu file hoặc checksum sai bị từ chối.
- AC-020-03: không có secret/data tenant khác; file/license không portable được báo trước export.
- AC-020-04: thay domain/auth/provider theo hướng dẫn và app dùng endpoint/issuer đúng; không gửi token SaaS sang instance khác.
- AC-020-05: core learning vẫn dùng được khi YiEdu update registry tạm không liên lạc được.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.
