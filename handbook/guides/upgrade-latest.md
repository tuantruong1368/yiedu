# Nâng cấp công nghệ — 24/10/2026

## Phạm vi

Python 3.15.1, Node.js 26.12.1 (Current, chưa phải LTS), npm 12.2.1,
PostgreSQL 18.6, FastAPI 0.162.0, Next.js 16.4.3.
React web 19.3.1, React mobile 19.3.0 (theo bộ Expo), Puck 0.23.0, Expo 58.0.17 và React Native 0.88.0.
Các dependency trực tiếp dùng phiên bản chính xác; npm lock giữ bộ dependency đã resolve.
Ngoại lệ: Expo 58 yêu cầu React 19.3.0; giữ bản này trên mobile thay vì ép 19.3.1 ngoài bộ SDK hỗ trợ.
Không dùng beta/RC/canary. Không có thay đổi chức năng sản phẩm hoặc schema Alembic trong đợt này.

## Máy đã chạy bản PostgreSQL 17

Thực hiện trong **đúng thư mục repo cũ**, giữ nguyên `.env`, tên thư mục và Compose project name.
Nếu trước đây dùng `docker compose -p TEN_DU_AN`, đặt `export COMPOSE_PROJECT_NAME=TEN_DU_AN` trước khi chạy script.
Không đổi mật khẩu DB trong quá trình này. Mở Docker Desktop và chờ Engine chạy.

```bash
git status --short
git switch main
git pull --ff-only origin main
python3 scripts/upgrade_postgres.py
docker compose up --build -d
docker compose ps
```

Nếu Git báo file đang sửa bị xung đột, dừng ở đó và giữ lại thay đổi; không reset/xóa file.
Python hệ thống 3.12+ vẫn chạy được script nâng cấp; Python 3.15.1 cho API nằm trong Docker.
Không cần cài Python/Node mới trên Mac nếu chạy toàn bộ sản phẩm bằng Docker.

Script dừng web/API để tránh ghi mới, chạy DB cũ bằng `compose.pg17.yaml`, tạo backup dạng custom
trong `backups/` với quyền riêng tư, rồi chuyển sang PostgreSQL 18 trên volume **mới**.
Restore thực hiện trong một transaction, từ chối ghi đè database có bảng, so sánh số dòng từng bảng.
Volume PostgreSQL 17 và file backup đều được giữ. Backup chứa thông tin tài khoản/dữ liệu thực:
không gửi file backup lên GitHub hay chia sẻ công khai. Các thư mục backup bị loại khỏi Git và Docker build.

Kết quả mong đợi: `PostgreSQL 18 restored; all public table row counts match.`
Chỉ chạy script chuyển dữ liệu **một lần** khi nâng từ bản cũ; các lần cập nhật sau dùng Compose bình thường.
Nếu chưa tạo dữ liệu nhưng đã chạy bản cũ, vẫn dùng script để chuyển schema và giữ cách thực hiện nhất quán.

### Nếu restore bị lỗi

Giữ ứng dụng dừng, giữ backup và cả hai volume. Không dùng `docker compose down -v`.
Sau khi sửa nguyên nhân, nếu database đích vẫn chưa có bảng, chạy lại từ backup đã tạo:

```bash
python3 scripts/upgrade_postgres.py --restore backups/postgres17-TEN_FILE.dump
docker compose up --build -d
```

Script sẽ từ chối nếu đích đã có bảng. Không xóa dữ liệu đích để bỏ qua cảnh báo.
Nếu cần quay lại bản cũ, phải dùng cả code cũ và DB cũ; DB 17 không chứa các thay đổi phát sinh trên 18.
Ghi lại commit trước khi nâng cấp bằng `git reflog`, giữ code hiện tại để điều tra rồi:

```bash
docker compose stop web api migrate db
git switch --detach COMMIT_TRUOC_NANG_CAP
docker compose up --build -d
```

Code bản trước sẽ dùng lại volume `postgres_data`. Đây là rollback môi trường local,
không phải quy trình rollback production. Không rollback sau khi đã ghi dữ liệu mới nếu chưa có kế hoạch hòa giải dữ liệu.

## Cài mới, chưa từng chạy YiEdu

```bash
python3 scripts/bootstrap.py
docker compose up --build -d
```

Compose mới dùng volume `postgres18_data` tại `/var/lib/postgresql` theo cấu trúc image PostgreSQL 18.

## Kiểm tra sau nâng cấp

```bash
docker compose exec api python --version
docker compose exec web node --version
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();"'
curl --fail http://localhost:8000/health/ready
docker compose logs --tail 80 api web
```

Mở http://localhost:3000. Đăng nhập bằng tài khoản cũ, kiểm tra tenant, nội dung builder,
khóa học, bài học và tiến độ học viên. Các dữ liệu này phải còn sau khi nâng cấp.
Tiêu chí nghiệm thu: API ready, web truy cập được, tài khoản cũ hoạt động và dữ liệu cũ được giữ.

## Chạy ngoài Docker để học/debug

Cài Python 3.15.1 và Node.js 26.12.1 (ví dụ dùng pyenv/nvm nếu máy đã có), tạo lại venv
thay vì tái sử dụng venv Python cũ. Các file `.python-version`, `.node-version`, `.nvmrc` ghi phiên bản.

```bash
python3.15 -m venv .venv315
source .venv315/bin/activate
python -m pip install -r requirements.lock
python -m pip install --no-deps -e .
docker compose up -d db
docker compose stop api web
alembic upgrade head
uvicorn yiedu.main:app --reload --host 127.0.0.1
```

Trong terminal khác dùng Node đúng phiên bản, `npm install --global npm@12.2.1`, sau đó
`cd web`, `npm ci`, `npm run dev`. Mobile tương tự: `cd mobile`, `npm ci`, `npm start`.
Không dùng `npm update` trên máy chạy sản phẩm để tự đổi bộ phiên bản ngoài lock.

## Chính sách tiếp theo

Theo yêu cầu chủ dự án, ưu tiên stable mới nhất; mỗi lần nâng cập nhật lock, chạy CI và ghi rõ kết quả.
Nếu SDK yêu cầu một bộ phiên bản cụ thể thì giải quyết tương thích trước khi phát hành.
Không tuyên bố toàn bộ dependency bắc cầu đều ở số phiên bản cao nhất: chúng phải tuân theo ràng buộc của upstream.
Tham khảo [Python](https://www.python.org/downloads/),
[Node.js](https://nodejs.org/en/download), [PostgreSQL](https://www.postgresql.org/support/versioning/),
[Expo](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).
