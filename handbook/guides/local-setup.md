# Chạy YiEdu trên Mac

## Điều kiện

Git và Docker Desktop đã cài, Docker đang chạy. Bootstrap chỉ cần Python 3.12+;
chạy API ngoài Docker cần Python 3.15.1. Mac M1 dùng image PostgreSQL
hỗ trợ ARM64. Kiểm tra, chưa cài phần nào thì dùng trang chính thức:
[Python](https://www.python.org/downloads/), [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/).

```bash
git --version
python3 --version
docker --version
docker compose version
```

## Lấy code và cài dependency

Repo đã xóa/tạo lại thì clone mới an toàn hơn pull vào lịch sử cũ. Không xóa thư mục cũ khi còn việc chưa lưu.

```bash
git clone git@github.com:tuantruong1368/yiedu.git yiedu-fresh
cd yiedu-fresh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock
python -m pip install --no-deps -e .
cp .env.example .env
```

Nếu chưa có SSH key trên GitHub, có thể clone bằng HTTPS:
`git clone https://github.com/tuantruong1368/yiedu.git yiedu-fresh` (chỉ chạy một cách clone).
`requirements.lock` ghi phiên bản đã kiểm tra cho Python 3.15.1; không phải lock đa nền tảng có hash.
Nếu cài bản Python khác, chọn Python 3.15.1 hoặc review và kiểm lại dependency.

Mở `.env` trong VSCode. Thay ADMIN_API_KEY bằng chuỗi từ lệnh:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Không chia sẻ key hoặc commit `.env`. Mật khẩu DB mẫu chỉ dành cho máy local.

## Chạy DB và migration

```bash
docker compose up -d db
docker compose ps
alembic upgrade head
alembic current
```

Chờ DB báo healthy trước khi migration. Migration mong đợi `0002 (head)`.

## Cách A — API chạy trong venv (dễ học/debug)

```bash
uvicorn yiedu.main:app --reload --host 127.0.0.1 --port 8000
```

Mở http://127.0.0.1:8000/docs. Bấm Authorize, nhập ADMIN_API_KEY trong `.env`.
Ở terminal thứ hai cùng repo:

```bash
source .venv/bin/activate
python scripts/smoke.py
```

Mong đợi `PASS` với ID tenant và course. Đây là dữ liệu demo local.

## Cách B — API chạy trong Docker

Dừng API cách A bằng Ctrl+C trước để tránh trùng cổng. Sau khi đã chạy migration:

```bash
docker compose up -d --build api
docker compose logs --tail 50 api
python scripts/smoke.py
```

Container không tự chạy migration. Docker DB/API chỉ bind loopback, không mở cho mạng ngoài.

## Chạy Handbook

```bash
mkdocs serve --dev-addr 127.0.0.1:8001
```

Mở http://127.0.0.1:8001. Build tĩnh để kiểm tra:

```bash
python scripts/check_docs.py
mkdocs build --strict
```

## Dừng và dữ liệu

Ctrl+C dừng tiến trình venv. `docker compose stop` dừng container, giữ dữ liệu.
`docker compose down` gỡ container/network, vẫn giữ named volume.
Không thêm `-v` nếu muốn giữ DB: tùy chọn đó sẽ xóa volume và dữ liệu local.

## Lỗi thường gặp

- Connection refused: Docker chưa chạy/DB chưa healthy hoặc DATABASE_URL sai.
- Port 5432/8000 đã dùng: kiểm tiến trình đang chạy; nếu đổi port DB thì sửa cả Compose và DATABASE_URL.
- Key không hợp lệ: thay key mẫu, tối thiểu 32 ký tự; khởi động lại API sau khi sửa `.env`.
- Sai mật khẩu DB sau khi sửa `.env`: DB volume cũ giữ credential ban đầu; sửa về credential đúng,
  không xóa volume để “sửa nhanh” khi còn dữ liệu cần giữ.
- `relation does not exist`: chạy `alembic upgrade head` với đúng DB.
- `ModuleNotFoundError yiedu`: kích hoạt venv và cài editable package.
- Python quá cũ: dùng Python 3.15.1, tạo lại venv bằng đúng interpreter.

Hoàn tất khi: Handbook mở được, health/ready trả 200, smoke PASS và anh giải thích được tenant/course vừa tạo.

Sản phẩm web/mobile 0.3: theo [hướng dẫn sản phẩm](product-local.md). Compose hiện tự chạy migration khi khởi động đầy đủ.
