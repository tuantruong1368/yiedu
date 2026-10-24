# Kết quả kiểm tra bộ nền

Ngày kiểm tra: 23/10/2026. Python 3.12, Linux; chưa chạy trên Mac của anh.

| Kiểm tra | Kết quả thực tế |
|---|---|
| `ruff check .` | Đạt |
| `python scripts/check_docs.py` | Đạt: link cục bộ và cấu trúc P0–P9 |
| `mkdocs build --strict` | Đạt; có thông báo upstream về MkDocs 2, repo giới hạn MkDocs < 2 |
| `pytest -q` local | 4 passed, 1 skipped; integration cần PostgreSQL riêng |
| `alembic upgrade head --sql` | Sinh SQL thành công; chưa chứng minh SQL đã chạy trên DB |
| Docker Compose / PostgreSQL local | Không chạy được trong môi trường soạn vì không có Docker/PostgreSQL |
| PostgreSQL integration trong GitHub Actions | Đạt: 5 passed, không skip; migration round-trip và drift check đạt |
| UAT / Mac / staging / production | Chưa thực hiện |

Có cảnh báo tương thích chuyển tiếp Starlette TestClient/httpx; 4 test vẫn pass.
Dependency được chốt phiên bản tại requirements.lock. CI cài lại từ file này.

Không dùng các kết quả bộ nền để kết luận đã đạt tenant auth/RLS, hiệu năng, thanh toán hoặc export.
CI kiểm migration upgrade/downgrade/upgrade trên DB tạm, drift check và test tenant/course.

## Bằng chứng CI

[Verify YiEdu — run 1](https://github.com/tuantruong1368/yiedu/actions/runs/39902905493)
đã hoàn tất thành công cho commit `75ce2d542f7abdb1809bd8500be03767474ba0fd`.
Ubuntu + Python 3.12 + PostgreSQL 17; cài dependency từ lock, lint, link, Handbook build,
upgrade, alembic check, downgrade/upgrade và 5 test đều đạt.

Chưa kiểm Docker image API chạy thực tế và chưa chạy trên Mac M1; CI PostgreSQL không thay thế
hai kiểm tra môi trường này. Hướng dẫn local có hai cách chạy; ưu tiên venv để học/debug.


## Kiểm tra cập nhật đặc tả v0.2

Lần cập nhật này: thay đổi spec/PM docs, thêm manifest contract/schema/examples/validator;
không đổi API tenant/course, dependencies hoặc migration database.

| Kiểm tra local | Kết quả |
|---|---|
| Ruff | Đạt |
| Link/P0–P9/FR-015–025 traceability | Đạt |
| Handbook strict build | Đạt |
| Pytest | 16 passed, 1 skipped (PostgreSQL integration) |
| Manifest mẫu và compatibility boundary | Đạt metadata; không là kiểm installer/code plugin |
| SaaS journey / OAuth / DNS / app / ZIP / update / marketplace UAT | Chưa triển khai/chưa chạy |

CI v0.2 [run 39914435513](https://github.com/tuantruong1368/yiedu/actions/runs/39914435513)
đã hoàn tất thành công cho commit `6f8d03fe31e5af2f40cf2c03fcdcc962ae53dd9b`:
lint, link/traceability, contract schema/examples, Handbook strict build, PostgreSQL 17
migration round-trip/drift và toàn bộ pytest đều đạt. Không phải kết quả UAT của chức năng SaaS v0.2.


## Bản chạy local 0.3.0 — kiểm tra trước push

- Ruff, link/traceability, contract schema/examples và Handbook strict build: đạt.
- Migration upgrade và Alembic drift check: đạt trên PostgreSQL WASM (PGlite) local.
- Pytest: 20 passed, bao gồm auth/tenant isolation/path/extension/export và restore sang schema sạch.
- Next.js production build và TypeScript: đạt.
- Playwright browser journey: đã chạy và đạt luồng owner → learner → ZIP.
- Expo TypeScript: đạt; Metro export bundle iOS và Android: đạt.
- Docker Compose, PostgreSQL 17 native và browser trên CI: chờ workflow của commit 0.3.
- Chưa có Mac M1/device UAT, signed APK/IPA, OAuth/payment/AI, third-party runtime, signed updater hoặc production.

Screenshots local đã được xem để kiểm bố cục; CI upload browser evidence dưới dạng artifact.
Đây là kiểm tra bản local, không phải nghiệm thu toàn bộ phạm vi FR-001–025.


Lần CI đầu của 0.3 phát hiện smoke Compose gửi request trước API sẵn sàng (connection reset).
Đã bổ sung API healthcheck, web đợi API healthy và curl retry các lỗi startup.
Kết quả chạy lại được ghi sau khi workflow hoàn tất; không coi lần đầu là pass.


## Kết quả CI 0.3 đã xác nhận

[Workflow 39922082793](https://github.com/tuantruong1368/yiedu/actions/runs/39922082793)
cho commit `de90a4d24b98f33b3e0ebeb1b2569bfaf46d2058` đã hoàn tất thành công:

| Job | Bằng chứng |
|---|---|
| product | Lint/docs/contracts; PostgreSQL 17 upgrade/check/downgrade/upgrade; pytest; Next production build; Playwright owner → learner → ZIP |
| compose | Build API/web images, DB/migration/API/web khởi động; API readiness và homepage HTTP smoke đạt |
| mobile | npm ci, TypeScript và Expo export bundle Android/iOS đạt |

Bằng chứng ảnh browser nằm trong artifact browser-evidence của workflow.
Không đổi kết quả này thành UAT production hoặc test trên thiết bị thật. Phần full-product còn mở
được ghi tại release-0.3.md và các issue #1–7; các issue đã được cập nhật trạng thái từng phần.

## Nâng cấp công nghệ 24/10/2026

Đối chiếu PyPI/npm stable mới nhất cho toàn bộ dependency trực tiếp và Python lock.
[Danh mục phiên bản](dependencies-2026-10-24.json), [hướng dẫn local](../guides/upgrade-latest.md).
Ngoại lệ: React mobile 19.3.0 theo yêu cầu Expo 58; web React 19.3.1.

Kiểm tra local trên Python 3.15.1/Node 26.12.1/npm 12.2.1:

- Cài toàn bộ Python requirements + editable package thành công.
- Ruff, contracts, docs links, MkDocs strict thành công.
- Pytest không cần DB: 16 passed; 4 integration tests để CI chạy PostgreSQL thật.
- Next.js 16.4.3 production build thành công.
- Expo offline dependency check, TypeScript và bundle Android/iOS thành công.
- CI bổ sung job database-upgrade: seed tài khoản/tenant/builder/khóa học/lộ trình/tiến độ và UTF-8 trên PostgreSQL 17,
  backup/restore 18, kiểm đăng nhập cũ, JSONB và tiến độ qua API.

CI cho commit `e152f3ec1579eedb12c9c29e52f922cc0ab2145c` đã hoàn tất: cả bốn job **success**.
[Workflow](https://github.com/tuantruong1368/yiedu/actions/runs/40040024736):

- `product`: Python 3.15.1/PostgreSQL 18.6, migration lên/xuống/lên, 20 pytest tests và browser journey pass.
- `mobile`: Expo dependency check, TypeScript và bundle Android/iOS pass trên Node 26.12.1/npm 12.2.1.
- `compose`: build image Python/Node mới, khởi động stack và kiểm tra API/web pass.
- `database-upgrade`: seed tài khoản, tenant, JSONB builder, khóa học, bài học, lộ trình và tiến độ trên 17;
  backup/restore sang 18; số dòng toàn bộ bảng khớp; đăng nhập cũ và dữ liệu học qua API pass.

Không có Docker daemon trong môi trường kiểm tra local của tác nhân; bằng chứng Docker/PostgreSQL thật
đến từ GitHub Actions Ubuntu x86_64. Có wheel Python 3.15 Linux ARM64 cho Psycopg/Pydantic/SQLAlchemy,
nhưng chưa trực tiếp chạy bản nâng cấp trên Mac M1 của anh hoặc thiết bị mobile thật.
Có cảnh báo upstream Starlette về httpx TestClient; chưa ảnh hưởng kết quả test.

## Authoring Studio 0.4 — 24/10/2026

- Python 3.15.1: Ruff, contract schema/bốn manifest ví dụ, docs links, MkDocs strict.
- Local PGlite socket (PostgreSQL WASM, không thay bằng chứng PostgreSQL native): Alembic lên head/check không drift; 25 pytest tests pass.
- Next production build trên Node 26.12.1/npm 12.2.1 pass; browser journeys kiểm template đã login, import VI/EN, page/menu, events và tenant branding.
- Journey owner/learner lưu/read lại công thức KaTeX và simulation Tiptap, học và tải ZIP.
- Mobile typecheck và bundle Android/iOS pass; chưa thử trên thiết bị thật.
- Danh mục project-structure đối chiếu đủ 184 file/58 thư mục, gồm SDK và migration mới.

Native PostgreSQL 18.6, Compose, migration round-trip và chuyển database cần xác nhận bằng CI của commit triển khai.
Giới hạn sản phẩm tại [release 0.4](release-0.4.md); chưa có checkout/installer/AI provider hoặc native interactive lesson renderer.
