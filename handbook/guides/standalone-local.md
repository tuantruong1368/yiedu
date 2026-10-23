# Kiểm tra và phục hồi ZIP local

Bản xuất 0.3 là gói source + tenant snapshot có checksum, chưa có chữ ký phát hành production.
Chỉ dùng gói do owner xuất và môi trường đích sạch; checksum xác minh toàn vẹn, không chứng minh nguồn tin cậy.

## Cách chạy bằng Python/Node

Giải nén ZIP vào thư mục mới. Đọc RESTORE.md. Cài dependencies như README repo, tạo .env cho
PostgreSQL ĐÍCH riêng và set INSTANCE_MODE=standalone. Không dùng DATABASE_URL SaaS.

```bash
python scripts/verify_export.py .
alembic upgrade head
python scripts/restore_snapshot.py snapshot.json
uvicorn yiedu.main:app --host 127.0.0.1
```

Script từ chối database không trống, schema sai hoặc data chéo tenant; nhập theo transaction.
Script in mật khẩu mới cho từng tài khoản vào terminal local; bảo quản và giao đúng người qua kênh riêng.
Session cũ không được mang theo. Phần email reset/verification chưa triển khai.

Terminal khác:

```bash
cd web
npm ci
INSTANCE_MODE=standalone npm run dev
```

Mở http://localhost:3000 hoặc `/t/<slug>`. Owner có workspace được dựng lại từ trang đã publish.
API mặc định tại 127.0.0.1:8000; cấu hình API_INTERNAL_URL nếu khác.

## Nếu dùng Docker

Trong thư mục ZIP, chạy bootstrap và sửa INSTANCE_MODE=standalone trong .env.
`docker compose up -d db` rồi `docker compose run --rm --build migrate`.
Snapshot không được copy vào image, mount read-only khi phục hồi:

```bash
docker compose run --rm --no-deps -v "$PWD/snapshot.json:/data/snapshot.json:ro" api python scripts/restore_snapshot.py /data/snapshot.json
docker compose up --build -d
```

Tên image `yiedu-api:local` đã được build bởi bước migrate. Không chạy song song với repo gốc ở cùng port;
dừng bản gốc hoặc cấu hình port/project name riêng trước. Không xóa volume có dữ liệu để tránh xung đột.

## Đã kiểm gì, còn gì?

Test tự động chứng minh snapshot phục hồi được vào schema sạch và quan hệ/mật khẩu được tạo lại.
Chưa diễn tập toàn bộ Docker restore trên Mac M1/server khách, OAuth provider, DNS/TLS,
license third-party, signed release/updater hoặc video storage. Không tự tick AC-020 toàn bộ.
