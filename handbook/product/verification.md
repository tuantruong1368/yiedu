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

CI của commit `9439fe939af823e6c374943ed61ea253f516fcff` đã hoàn tất cả bốn job **success**.
[Workflow 0.4](https://github.com/tuantruong1368/yiedu/actions/runs/40063998726):

- product: PostgreSQL 18.6 native, migration upgrade/check/downgrade/upgrade, 25 pytest tests, Next production build và hai browser journeys pass.
- mobile: Expo dependency check, TypeScript và Android/iOS bundle pass.
- compose: image API/web mới build và stack health/API/web smoke pass.
- database-upgrade: seed dữ liệu 17, dump/restore 18, kiểm dữ liệu và đăng nhập cũ, khởi động app mới pass.

Local browser kiểm cả absolute position, width bằng inspector, zoom, menu/page/VI/EN, sandbox events,
logo tenant và lưu/read lại math/simulation. Chưa mô phỏng mọi pointer drag/resize trên mọi thiết bị.
Giới hạn sản phẩm tại [release 0.4](release-0.4.md); chưa có checkout/installer/AI provider hoặc native interactive lesson renderer.

### Chốt metadata white-label

Commit `b2ed93f10ee9fcdad9e6791f1bf57af6de8ee13b` bổ sung title tenant không có suffix YiEdu
và hoàn thiện hướng dẫn local. [CI cuối](https://github.com/tuantruong1368/yiedu/actions/runs/40064407301)
đã pass cả product, mobile, compose, database-upgrade; browser có assertion title không chứa YiEdu.
Bản ghi tài liệu sau commit này không thay đổi code đã được kiểm tra.

## Template library 0.5 — 24/10/2026

Local: Python 3.15.1, Node 26.12.1. `ruff check .`, check_contracts, check_docs,
`mkdocs build --strict`, Next production build đều qua. Migration 0004/alembic check và
28 pytest qua với PGlite PostgreSQL protocol (không thay cho PostgreSQL native trong CI).
3 Playwright qua với Chromium: authoring, owner/learner/export, template preview VI/EN.
Ví dụ code của 65 module được chạy và đối chiếu expected output; không kiểm chứng toàn bộ
nội dung chuyên môn hoặc hiệu quả học tập. CI native PostgreSQL được ghi bổ sung sau khi chạy.

CI nguồn cuối `07046d77813e420ad24f7e3b9373bc07fa9ba54b`:
[run 40072085554](https://github.com/tuantruong1368/yiedu/actions/runs/40072085554)
đã thành công cả 4 job: product (PostgreSQL 18.6 native, migration upgrade/downgrade,
29 pytest, Next production build, 3 Playwright), mobile (typecheck, Expo iOS/Android bundles),
compose (build/ready/homepage), database-upgrade (PostgreSQL 17→18 giữ dữ liệu và chạy lại app).
Đã xem ảnh preview Yirobot desktop: bố cục hero, chữ Việt, robot CSS và CTA hiển thị đúng.
Không có kiểm chứng chuyên gia nội dung, thiết bị mobile thật hoặc triển khai production.

## Content Studio 0.6 — 24/10/2026

Local nguồn 0.6: Python 3.15.1, Node.js 26.12.1/npm 12.2.1, PGlite socket.
Ruff, schema manifest/5 ví dụ, link tài liệu, MkDocs strict và Next production build qua.
Migration 0005 và `alembic check` không drift; **41 pytest** qua, gồm schema/media, ACL,
revision conflict, cập nhật bài 0.5 đúng fingerprint, giữ bài đã sửa, không nhân đôi assets,
learner enrollment và khôi phục snapshot Studio vào schema trống.

**4 Playwright journeys** qua trên Chromium: builder cũ; owner/learner/export;
thư viện template VI/EN; và luồng Content Studio mới. Luồng mới kiểm ảnh website thật,
đổi page slug và bấm đủ menu, tạo/lưu/mở lại slide/mô phỏng/video, tải file video >1000 byte,
chuyển form gọn sang editor full page không mất bài, chèn/sửa snapshot, learner tương tác và hoàn thành.
Đã xem ảnh template card, slide editor, lesson preview và bài học learner; sửa độ tương phản chữ slide.
Danh mục developer đã cập nhật đủ 226 file/68 thư mục.

Đây chưa là kiểm thử mọi trình duyệt, quyền micro trên Mac M1, thiết bị native thật hoặc đánh giá
chuyên gia cho toàn bộ giáo trình. Video export được kiểm ở chế độ không thu micro.
Không có Docker daemon local; kết quả PostgreSQL 18.6 native/Compose/mobile/upgrade được xác nhận
riêng qua CI sau khi đưa nguồn lên main. PGlite local không thay thế bằng chứng đó.

CI nguồn `9866c34f2dc656bec4d642f5100aef2598c7fcc5`:
[run 40077614987](https://github.com/tuantruong1368/yiedu/actions/runs/40077614987)
đã thành công **cả 4 job**: product (PostgreSQL 18.6 native, migration/check/downgrade/upgrade,
41 pytest, Next production build và 4 Playwright journeys), mobile (typecheck, Expo iOS/Android
bundles), compose (build/ready/homepage), database-upgrade (PostgreSQL 17→18, giữ dữ liệu và
chạy lại app). Lần ghi bằng chứng sau commit này chỉ sửa tài liệu, không thay code đã kiểm tra.

## Website Studio 0.7 — 24/10/2026

Local trên Python 3.15.1, Node.js 26.12.1 và PGlite socket: Ruff, schema/contracts,
docs links, MkDocs strict và Next production build thành công. Alembic lên head/check
không drift; **44 pytest** qua, gồm public render/CSP, escaping và chỉ hiển thị course published.
PGlite không thay thế PostgreSQL native trong CI.

**7 Playwright journeys** qua trên Chromium, chạy toàn bộ suite trên production build:

- Điều hướng trang/menu, vào/ra quản trị lặp lại, Back/Forward, đổi VI/EN và reload vẫn giữ nội dung.
- Thư viện 23 SVG, lọc/tìm, kéo chuột thật vào iframe đã zoom, thêm section, preview và publish.
- Màu Indigo được kiểm bằng computed style trong canvas, sau mở lại và trên website công khai;
  PostCSS giữ CSS variables/shorthand thay vì để CSSOM làm mất chúng.
- Danh sách 30 course/25 lesson: mở bài cuối, editor ở cạnh danh sách, tạo/lưu và trở về đúng
  khóa/bài từ Studio toàn màn hình.
- Những luồng cũ: import/VI/EN/events/branding, owner→learner→ZIP, preview template, thư viện
  slide/mô phỏng/video, xuất video có dữ liệu và learner tương tác/hoàn thành.

Đã xem ảnh Website Studio và CourseWorkspace; vùng canvas khớp zoom/chiều cao và editor không
nằm dưới danh sách. Export video gắn canvas vào DOM và yêu cầu frame; không tải file nếu recorder
không ghi được dữ liệu. Danh mục developer đối chiếu 236 file/68 thư mục.

Chưa thử mọi trình duyệt, quyền micro trên thiết bị thật hoặc mọi thao tác touch. Không có Docker
daemon local; bằng chứng native PostgreSQL, Compose, mobile và nâng cấp 17→18 ghi riêng từ CI.


CI nguồn cuối `39b7e5c04259483c096f985dd60509064dff0f83`:
[run 40090824799](https://github.com/tuantruong1368/yiedu/actions/runs/40090824799)
đã thành công **cả 4 job**: product (PostgreSQL 18.6 native, migration/check/downgrade/upgrade,
44 pytest, Next production build và 7 Playwright journeys), mobile (typecheck, Expo iOS/Android
bundles), compose (build/ready/homepage), database-upgrade (PostgreSQL 17→18 giữ dữ liệu và
chạy lại app). Luồng danh sách dài còn kiểm phím Enter lưu bài mà không chuyển sang Studio.
Lần ghi bằng chứng sau commit này chỉ sửa tài liệu, không thay code đã kiểm tra.

## Trải nghiệm 0.8 — 24/10/2026

Nguồn local 0.8 trên Python 3.15.1/Node.js 26.12.1: Ruff, contracts/5 metadata examples,
docs links, MkDocs strict và Next production build thành công. PGlite socket chạy Alembic
lên head/check không drift; **47 pytest** qua, gồm catalog groups, HTML preview/CSP/404/422,
Yoga copy riêng tenant, learner enrollment/completion và ZIP giữ SVG/source mobile.
PGlite là PostgreSQL WASM qua protocol, không thay thế PostgreSQL native trong CI.

**11 Playwright tests** qua trên production build: 10 luồng browser và một kiểm tra return URL.
Đã kiểm tìm không dấu, đổi nhóm/thao tác nhanh, hover opacity, preview có logo/menu/năm trang,
ảnh SVG nạp được, mobile menu, Back giữ gallery filter; sidebar chỉ một logo và giữ DOM qua tab;
Studio nhúng → tool → lưu không remount → Back đúng filter; đăng nhập lại về đúng panel;
lesson → tạo slide trong cùng tab → Back về đúng lesson rồi đúng khóa/bài; Yoga learner đọc,
mở player theo yêu cầu, reload và hoàn thành. Các luồng cũ builder/import/VI/EN/events, course
list dài, public history, slide/video/mô phỏng và owner→learner→ZIP đều chạy lại thành công.

Đã xem ảnh thư viện nhóm/Yoga và Studio nhúng, sửa căn lề course gadget, search hàng ngang và
ẩn poster khi lỗi. Video gốc được đối chiếu từ trang chính thức của tác giả; kiểm thử browser
chặn request player ngoài trong case Yoga để kiểm hợp đồng iframe/nguồn, không xác nhận playback
YouTube trực tiếp trên mọi vùng/mạng. Có nguồn dự phòng để người dùng mở video tại nhà cung cấp.

Mobile typecheck, Expo offline dependency check và export bundle Android/iOS qua.
Danh mục developer đối chiếu **252 file/70 thư mục**. Chưa có Docker daemon local, UAT thiết bị
thật, benchmark mọi trình duyệt/mạng hoặc nghiệm thu giáo trình bởi chuyên gia Yoga.
Kết quả Docker, native PostgreSQL 18.6 và upgrade 17→18 ghi riêng từ CI nguồn cuối.


CI nguồn cuối `361a2cedceb19b2e02aebee4a9d84ddfca7b6bad`:
[run 40110265808](https://github.com/tuantruong1368/yiedu/actions/runs/40110265808)
đã thành công **cả 4 job**:

- product: PostgreSQL 18.6 native, migration/check/downgrade/upgrade, 47 pytest,
  Next production build và 11 Playwright tests.
- mobile: typecheck, Expo dependency check và bundle iOS/Android.
- compose: build/khởi động stack, API/web health và HTTP tải SVG Yoga trong image standalone.
- database-upgrade: PostgreSQL 17→18, giữ dữ liệu/UTF-8 và đăng nhập cũ, chạy lại app mới.

Gói export đã kiểm cả file khởi động khai báo trong mobile/package.json, SVG và dữ liệu học.
Lần ghi bằng chứng sau commit này chỉ sửa tài liệu, không thay code đã kiểm tra.



## 25/10/2026 — 0.9 platform, AI và commerce

- Local: Ruff, docs links/contracts, MkDocs strict; migration `upgrade head` + `alembic check`;
  **62 pytest** trên PostgreSQL wire-compatible PGlite, không thay cho chứng cứ PostgreSQL thật.
- Next production build + **16 Playwright**: 11 regression cũ, 5 bài mới gồm URL safety,
  logo/full-width/mobile, archive/restore, bank checkout/reconcile/learn, platform design và AI review/apply.
  Sau chỉnh context checkout và transaction locks, chạy lại 62 API + 5 browser business: đều qua.
- Expo typecheck + offline dependency check, export bundle Android/iOS qua. Không có thiết bị thật,
  ký binary hoặc in-app purchase được thử trong lượt này.
- OpenAI/PayPal/MoMo contract dùng fake provider responses và HMAC fixtures; AI UI dùng draft fixture
  để kiểm review/apply. Không gọi API tính phí, không phát sinh giao dịch tiền thật.
- Bằng chứng browser: `yiedu-brand-hero.png`, `yiedu-brand-mobile.png`, `verified-checkout.png`,
  `platform-template-editor.png`, `platform-ai-studio.png` trong artifact CI `browser-evidence`.
- [CI nguồn `fae6812`](https://github.com/tuantruong1368/yiedu/actions/runs/40123416075): cả 4 job **product, mobile, compose, database-upgrade** thành công.
  PostgreSQL 18.6 thật: migration upgrade/downgrade/schema check và **62 pytest**; Next production build
  và **16 Playwright** qua. Docker Compose khởi động sạch, nâng dữ liệu PostgreSQL 17→18 giữ nguyên.
  Bài kiểm archive/restore chờ danh sách cập nhật trước khi đọc public API để tránh race trên runner chậm.
