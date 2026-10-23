# Extension architecture và SDK

Trạng thái: thiết kế đề xuất. Có validator manifest thử nghiệm; chưa có loader/installer/execution host.

## Loại extension YiEdu

| Loại | Trách nhiệm | Ví dụ |
|---|---|---|
| template | Bộ giao diện, page/block config và assets | Trung tâm đào tạo |
| component | Phân hệ nghiệp vụ có API/admin UI/permission | Chứng chỉ, thi trực tuyến |
| plugin | Handler cho sự kiện/hook được định nghĩa | Gửi thông báo hoàn thành |
| block | Khối UI có schema và renderer | Video, testimonial, câu hỏi |

Cách phân loại lấy cảm hứng Joomla; package XML/PHP Joomla không tương thích trực tiếp.
Không fork/sửa core cho từng khách. Dùng config, template override và extension API có version.

## Registry, artifact và installation là ba việc khác nhau

Package = danh tính ổn định `vendor.name`; version = release immutable; entitlement = quyền sử dụng;
installation = trạng thái/cấu hình extension trong tenant hoặc instance. Mua không đồng nghĩa đã cài,
cài không đồng nghĩa đã bật, manifest hợp lệ không chứng minh code an toàn hay đúng license.

Shared SaaS: artifact vào pipeline kiểm duyệt/build trước; tenant chọn cài/kích hoạt qua catalog.
Một deployment cohort dùng cùng artifact/code version; tenant config bật/tắt độc lập.
Không sửa schema riêng cho mỗi tenant bật extension. Shared schema migration chạy ở deployment;
provision dữ liệu extension theo tenant là job khác. Nếu cần hai code version thì dùng cohort/instance riêng.
Standalone: tenant admin tải package đã xác minh, updater/installer có quyền rõ, migration theo instance.
Gỡ extension mặc định giữ dữ liệu; xóa dữ liệu cần hành động riêng có xác nhận và audit.

## Hợp đồng gói đề xuất

Manifest JSON v0.1 ghi package ID/type/version, core/API min inclusive/max exclusive,
capabilities, dependencies, surfaces (web/admin/mobile), portability và data_schema_version.
Ví dụ trong `extensions/examples/`; schema máy đọc trong `contracts/extension-manifest.schema.json`.
Validator chỉ đọc JSON và kiểm metadata/range; chưa kiểm chữ ký, artifact, dependency graph hay migration.
Chạy: `python scripts/validate_extension.py extensions/examples/training-template/manifest.json`.

Bản phân phối thật cần release envelope riêng: artifact digest/size, chữ ký/publisher key, xuất xứ,
phụ thuộc đã resolve, hỗ trợ migration, license/entitlement và audit. Hash không thay chữ ký.
Không cho URL cập nhật tùy ý truy cập metadata/internal network; registry/endpoint phải được tin cậy.

## Hooks và data contract

Đề xuất event có envelope `event_id`, `event_type`, `schema_version`, `tenant_id`, `occurred_at`,
`actor_id`, payload tối thiểu. Ví dụ `learning.course.completed.v1`, `learning.lesson.published.v1`.
Dùng transactional outbox khi cần; delivery at-least-once, consumer deduplicate event_id, timeout,
retry có giới hạn, dead-letter và observability. Không gọi plugin lỗi làm rollback mọi hoạt động học.
Synchronous hooks giới hạn cho kiểm tra xác định, không I/O vô hạn hoặc tự thay authorization.

Capability như `courses:read`, `pages:write`, `notifications:send` phải được enforce ở API/host,
không chỉ ghi trong manifest. Backend code chạy cùng process có thể vượt abstraction;
third-party server code cần host/service cô lập, quyền DB/API tối thiểu, timeout/resource limit và egress policy.
UI bên thứ ba cần build/review hoặc sandbox theo trust model; JSON page content không cho script tùy ý.

## Developer workflow mục tiêu

Đăng ký seller → tạo package ID → dùng SDK/schema/examples → test contract/compatibility →
đóng artifact → submit → review → sign/publish → hỗ trợ và phát hành version tiếp theo.
CI developer cần fixture tenant, data migration, frontend SSR/accessibility, quyền và compatibility.
Hiện examples chỉ là metadata minh họa, không phải extension có chức năng có thể cài.

## AC

- AC-022-01: thiếu quyền/entitlement hoặc version không tương thích thì từ chối trước kích hoạt.
- AC-022-02: tenant A bật plugin không ảnh hưởng trạng thái/config của B; không truy cập data B.
- AC-022-03: disable/gỡ theo chính sách dữ liệu; lỗi plugin có timeout/circuit breaker, không sập core.
- AC-024-01: package/version trùng hoặc dependency vòng lặp bị từ chối bởi registry/resolver mục tiêu.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.
