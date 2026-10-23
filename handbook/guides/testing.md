# Chạy kiểm tra

Chạy từ gốc repo, `.venv` đã kích hoạt và dependency đã cài.

## Không cần database

```bash
ruff check .
python scripts/check_docs.py
mkdocs build --strict
pytest -q -m 'not integration'
```

Kiểm auth boundary, validation, key mẫu; không chứng minh DB/migration hoạt động.

## Integration dùng PostgreSQL test riêng

DB test không dùng dữ liệu cần giữ. Bắt đầu DB theo local setup. Tạo test database một lần:

```bash
docker compose exec db createdb -U yiedu yiedu_test
```

Nếu tên DB đã có, không tạo lại hoặc drop tùy tiện. Thay user nếu anh đã đổi POSTGRES_USER.
Dùng credential test/local trong `.env`, nhập an toàn qua script Python để tránh lộ trên command history:

```bash
python scripts/test_postgres.py
```

Script đọc DATABASE_URL, chuyển database thành `yiedu_test`, chạy migration, drift check,
upgrade/downgrade/upgrade trên DB TEST và toàn bộ pytest. Chỉ chạy với DB test dành riêng.
Test tạo dữ liệu UUID và dọn đúng dữ liệu của mình; migration downgrade sẽ xóa hai bảng trong DB test.
Không trỏ script vào DB production. CI cung cấp một PostgreSQL tạm riêng để chạy lại toàn bộ.

## Kiểm tra smoke

```bash
python scripts/smoke.py
```

Smoke kiểm một đường API đang chạy; không thay regression/integration test.
Khi chưa có TEST_DATABASE_URL, `pytest -q` sẽ skip integration; phải báo rõ skip.

## Khi thay schema

Sửa model → tạo migration → đọc migration → thử upgrade/test → kiểm downgrade trên DB test
nếu an toàn → upgrade lại → `alembic check`. Không dùng create_all để thay migration production.
Không chạy lệnh downgrade xóa dữ liệu trên DB đang dùng.

## Bằng chứng

Ghi commit, môi trường, lệnh, số pass/skip/fail và giới hạn. Kết quả thật hiện tại ở
[verification](../product/verification.md). GitHub Actions xanh là kiểm tự động, không thay UAT.
