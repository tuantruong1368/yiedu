# YiEdu

Tạo và vận hành hệ thống e-learning mang thương hiệu riêng.
Yisoft và Yirobot là tenant demo, không phải khóa học do YiEdu bán.

## Bản chạy local 0.8.0

Mới: [Nhóm template, An Nhiên Yoga và điều hướng ổn định](handbook/guides/experience-yoga.md):
15 mẫu/7 nhóm, Yoga 16 bài có video, preview đủ logo/menu, Studio trong panel quản trị và Back giữ ngữ cảnh.
[Phạm vi 0.8](handbook/product/release-0.8.md).

## Website Studio 0.7

Mới: [Website Studio và quản trị bài học](handbook/guides/website-studio.md): sửa hiển thị khi điều hướng,
23 gadget có preview SVG, PostCSS, theme/preview và editor bài học ngay cạnh danh sách.
[Phạm vi 0.7](handbook/product/release-0.7.md).

Mới: [Content Studio toàn màn hình](handbook/guides/content-studio.md), website template thu nhỏ đúng giao diện,
slide/video/mô phỏng độc lập, bài giảng có học liệu và nâng cấp bài mẫu giữ nội dung khách đã sửa.
[Phạm vi 0.6 và giới hạn](handbook/product/release-0.6.md).

Mới: [15 template và học liệu Việt/Anh](handbook/guides/template-library.md), xem trước website/bài học và copy nội dung riêng cho tenant khi xuất bản.

Đã có website Next.js + GrapesJS builder, Tiptap lesson editor, API FastAPI, PostgreSQL
và mã nguồn app React Native/Expo. Puck renderer giữ cho trang cũ.
Mới: VI/EN, page/menu, logo tenant, HTML/CSS import, gadget/events và lesson tool registry.
[Hướng dẫn Authoring Studio và SDK](handbook/guides/authoring-sdk.md),
[ma trận 0.4 và giới hạn](handbook/product/release-0.4.md).
Luồng chính đã được chạy thử: đăng ký email → chọn template → thiết kế → xuất bản tenant →
quản trị khóa học/bài học/lộ trình → học viên tham gia/học/ghi tiến độ → tải ZIP.

**Chưa phải toàn bộ sản phẩm thương mại.** Google/Facebook, email verification/reset,
thanh toán, AI, upload/media storage, bài kiểm tra, RLS, worker jobs, ký/áp dụng update tự động,
third-party plugin execution và marketplace mua bán chưa triển khai. Developer portal mới nhận metadata.
App đóng gói được bundle iOS/Android; chưa thử trên thiết bị thật, ký binary hoặc phát hành store.
Xem [ma trận trạng thái 0.4](handbook/product/release-0.4.md) trước khi đánh giá phạm vi.

**Đã có dữ liệu từ bản trước?** Đọc [hướng dẫn nâng cấp và giữ dữ liệu](handbook/guides/upgrade-latest.md) trước khi chạy Compose mới.

## Dành cho developer mới

Đọc [cấu trúc dự án và chức năng từng file](handbook/guides/project-structure.md),
sau đó làm theo [hướng dẫn tham gia phát triển](CONTRIBUTING.md).

## Chạy bằng Docker — cách gọn nhất

Cần Git, Python 3.12+ (chỉ cho bootstrap) và Docker Desktop đang chạy.
API dùng Python 3.15.1 trong container; không cần cài lại Python/Node trên Mac khi dùng Docker.
Trong thư mục repo anh đã clone/pull:

```bash
python3 scripts/bootstrap.py
docker compose up --build -d
```

Lần đầu có thể cần chờ tải/build image. Compose khởi động PostgreSQL, chạy migration, API và web.
Mở **http://localhost:3000** → chọn mẫu → tạo tài khoản email → tạo hệ thống.
Địa chỉ tenant local: `http://localhost:3000/t/<slug>`; admin: `/t/<slug>/administrator`.
Ví dụ `http://yisoft.localhost:3000` cũng được route theo hostname nếu trình duyệt hỗ trợ `.localhost`.
Chưa tạo DNS/chứng chỉ hoặc website public tại yiedu.vn.

```bash
docker compose ps
docker compose logs --tail 80 api web
docker compose stop
```

Dữ liệu nằm trong named volume. Không thêm `-v` khi down nếu cần giữ database.
Nếu .env đã có từ trước, bootstrap giữ nguyên; kiểm ADMIN_API_KEY đã thay khỏi giá trị mẫu.
Với mật khẩu DB có ký tự đặc biệt, cần URL-encode trong DATABASE_URL hoặc dùng key do bootstrap tạo.

## Chạy bằng VSCode để học/debug

```bash
python3.15 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.lock
python -m pip install --no-deps -e .
python scripts/bootstrap.py
docker compose up -d db
alembic upgrade head
uvicorn yiedu.main:app --reload --host 127.0.0.1
```

Terminal khác:

```bash
cd web
npm ci
npm run dev
```

Node.js 26.12.1 được dùng để kiểm tra. API docs: http://127.0.0.1:8000/docs.
Endpoint `/runtime` dùng tài khoản/session; các endpoint `/tenants` cũ dành riêng cho platform admin key.
Không gửi admin key vào frontend hoặc mobile.

## Handbook và thứ tự học

```bash
source .venv/bin/activate
mkdocs serve --dev-addr 127.0.0.1:8001
```

Mở http://127.0.0.1:8001. [Bắt đầu](handbook/start-here.md) → P0–P9 →
[hướng dẫn chạy sản phẩm](handbook/guides/product-local.md) → [ma trận 0.4](handbook/product/release-0.4.md).

## Mobile

Xem [hướng dẫn app](handbook/guides/mobile.md). Tài khoản tạo tại website tenant, sau đó dùng app chung.
Bundle Expo không phải file APK/IPA đã ký. Điện thoại không truy cập được localhost của máy Mac;
local dev cần API qua địa chỉ LAN/tunnel phù hợp và bật riêng HTTP dev khi cần.

## Kiểm tra

```bash
ruff check .
python scripts/check_docs.py
python scripts/check_contracts.py
mkdocs build --strict
pytest -q -m 'not integration'
```

CI chạy PostgreSQL 18.6 migration + integration, Next build + browser journey, TypeScript và Expo bundle.
[Test guide](handbook/guides/testing.md), [bằng chứng](handbook/product/verification.md).

Chưa có LICENSE cấp quyền thương mại toàn bộ source. Chính sách cấp phép khách hàng/developer và
thành phần bên thứ ba cần được quyết định trước thương mại.
