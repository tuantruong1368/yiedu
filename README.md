# YiEdu

Nền tảng SaaS giúp khách hàng tạo và vận hành hệ thống e-learning mang thương hiệu riêng.
Yisoft và Yirobot là hệ thống khách hàng demo, không phải khóa học do YiEdu bán.

**Điểm bắt đầu cho anh Tuân:** [Lộ trình đọc và thực hành](handbook/start-here.md).
Học theo thứ tự P0–P9, rồi quay lại chu trình sprint khi phát triển thêm.

## Có gì trong repo?

- Handbook tiếng Việt cho toàn bộ P0–P9, bài thực hành, đầu ra và tiêu chí qua bước.
- Hồ sơ YiEdu: charter, discovery, phạm vi, yêu cầu, backlog, kiến trúc và quyết định.
- FastAPI + PostgreSQL: migration, health check, tạo/list tenant và course qua API admin.
- Docker Compose, kiểm thử, CI và hướng dẫn chạy trên Mac.

**Đây là nền tảng học tập và khởi tạo, chưa phải sản phẩm thương mại hoàn chỉnh.**
Thanh toán, đăng nhập học viên, RLS, Puck, mobile, AI và xuất hệ thống chưa triển khai.
Tài liệu giai đoạn sau là thiết kế/quy trình dự kiến, không phải bằng chứng đã nghiệm thu.
Xem [trạng thái thực tế](handbook/product/status.md).

## Chạy nhanh trên Mac

Cài Git, Python 3.12+ và Docker Desktop trước; mở Docker Desktop.
Nếu máy đang có thư mục yiedu của repo cũ, clone repo mới vào thư mục khác.

```bash
git clone git@github.com:tuantruong1368/yiedu.git yiedu-fresh
cd yiedu-fresh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock
python -m pip install --no-deps -e .
cp .env.example .env
```

Mở `.env` trong VSCode, thay `ADMIN_API_KEY` bằng kết quả lệnh:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Sau đó:

```bash
docker compose up -d db
alembic upgrade head
uvicorn yiedu.main:app --reload --host 127.0.0.1
```

API docs: http://127.0.0.1:8000/docs. Bấm Authorize và nhập ADMIN_API_KEY.
Chạy thử ở terminal thứ hai, cùng thư mục và đã kích hoạt `.venv`:

```bash
python scripts/smoke.py
mkdocs serve --dev-addr 127.0.0.1:8001
```

Handbook: http://127.0.0.1:8001. Mỗi lần smoke tạo một tenant demo mới.
Hướng dẫn đầy đủ: [Local setup](handbook/guides/local-setup.md).

## Kiểm tra

```bash
ruff check .
python scripts/check_docs.py
mkdocs build --strict
pytest -q -m 'not integration'
```

[Kiểm thử PostgreSQL](handbook/guides/testing.md) dùng database test riêng.

## Thứ tự học

1. [Bắt đầu ở đây](handbook/start-here.md)
2. [P0 — Khởi tạo](handbook/phases/p0-initiation/index.md)
3. [Charter YiEdu](handbook/product/charter.md)
4. [Quyết định đã chốt](handbook/product/decision-log.md)
5. [Backlog và kế hoạch](handbook/product/backlog.md)

Không có LICENSE cấp quyền thương mại mã nguồn tại thời điểm khởi tạo; chính sách cấp phép cho
khách hàng và thành phần bên thứ ba cần được quyết định trước khi bán bản xuất độc lập.
