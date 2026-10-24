# Developer quickstart — manifest contract v0.1

Developer mới của toàn hệ thống: đọc [cấu trúc dự án](project-structure.md) và
[CONTRIBUTING](https://github.com/tuantruong1368/yiedu/blob/main/CONTRIBUTING.md) trước. Trang này chỉ dành cho contract extension.

Đây là bài thực hành chuẩn bị SDK, không phải marketplace hoặc installer chạy được.
Cài dependency/editable package theo local setup, kích hoạt `.venv`, chạy từ gốc repo.

## 1. Đọc hợp đồng

`backend/yiedu/extensions/manifest.py` là nguồn schema. `contracts/extension-manifest.schema.json`
là bản JSON Schema sinh từ Pydantic. Model validator có thêm quy tắc ngữ nghĩa (range có thứ tự,
không trùng/self dependency); chỉ chạy JSON Schema chưa thay thế Python validator.
Manifest v0.1 chỉ nhận stable x.y.z, không hỗ trợ prerelease/build/range expressions khác.
Capability list chỉ là catalog thử nghiệm; enforce quyền runtime chưa triển khai.

## 2. Kiểm tra mẫu

```bash
python scripts/validate_extension.py extensions/examples/training-template/manifest.json
python scripts/validate_extension.py extensions/examples/certificates-component/manifest.json
python scripts/validate_extension.py extensions/examples/completion-plugin/manifest.json
```

Mong đợi `VALID METADATA` và thông báo chưa cài/chưa xác minh chữ ký/license/runtime.
Đối chiếu range thử nghiệm:

```bash
python scripts/validate_extension.py extensions/examples/training-template/manifest.json --core 0.1.0 --extension-api 0.1.0
```

Thử `--core 1.0.0` với API 0.1.0: phải trả INVALID/exit 1 vì chạm max exclusive.
Các version ví dụ không chứng minh YiEdu core đã có extension API tương ứng.

## 3. Kiểm thử

```bash
python scripts/check_contracts.py
pytest -q tests/test_extension_manifest.py
```

Kiểm range biên, metadata sai, capability không biết, trùng/self dependency và các JSON ví dụ.
Không kiểm artifact signature, dependency graph, sandbox hay migration vì chưa có các thành phần đó.

## 4. Khi phát triển SDK thật

Story tiếp theo cần package artifact format, dependency resolver, event/capability enforcement,
build UI/backend, signing/review và test host isolation. Theo [kiến trúc extension](../product/extensions.md).
Chưa có lệnh install/publish; không import code lấy từ manifest hoặc chạy ZIP do người dùng tải lên.
