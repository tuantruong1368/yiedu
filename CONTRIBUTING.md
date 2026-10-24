# Tham gia phát triển YiEdu

Tài liệu onboarding cho developer làm việc với mã nguồn YiEdu. Chủ dự án: anh Trương Châu Tuân.
Quyền truy cập GitHub và phân công công việc do chủ dự án cấp; chưa có chính sách cấp phép thương mại
cho toàn bộ source. Không suy ra quyền phân phối lại từ quyền đọc repository.

## 1. Đọc trước khi nhận việc

1. [README](README.md): cách chạy và giới hạn sản phẩm.
2. [Trạng thái](handbook/product/status.md), [ma trận 0.4](handbook/product/release-0.4.md): phân biệt đã chạy và kế hoạch.
3. [Cấu trúc dự án](handbook/guides/project-structure.md): từng thư mục/file, entry point và nơi sửa tính năng.
4. [Yêu cầu](handbook/product/requirements.md), [backlog](handbook/product/backlog.md), [truy vết](handbook/product/traceability-v2.md): mục tiêu của công việc.
5. [Quyết định](handbook/product/decision-log.md), [kiến trúc](handbook/product/architecture.md), [AGENTS](AGENTS.md): ràng buộc và phối hợp với AI.

`handbook/guides/developer-quickstart.md` chỉ là quickstart manifest extension thử nghiệm,
không phải hướng dẫn onboarding toàn hệ thống. Không bắt đầu bằng viết plugin runtime chưa có host.

## 2. Thiết lập local

Git/SSH đã được cấp quyền, Docker Desktop đang chạy; Python 3.12+ chỉ cần cho bootstrap.
API Python 3.15.1 và web Node 26.12.1 chạy trong Docker, không cần cài hai runtime đó trên host
nếu chỉ chạy stack Docker. Clone lần đầu:

```bash
git clone git@github.com:tuantruong1368/yiedu.git
cd yiedu
python3 scripts/bootstrap.py
docker compose up --build -d
docker compose ps
```

Mở http://localhost:3000 và API docs http://localhost:8000/docs.
Nếu đã có checkout/database cũ, không clone đè hoặc tự tạo credential mới:
đọc [hướng dẫn nâng cấp giữ dữ liệu](handbook/guides/upgrade-latest.md) trước khi bật Compose mới.

Thực hành tạo owner → workspace → publish tenant → course/lesson → learner/enroll/complete.
Giữ `.env` và `backups/` riêng tư. Không dùng `docker compose down -v` để sửa lỗi thông thường.
Các port Compose chỉ bind loopback; xem [mobile](handbook/guides/mobile.md) khi kết nối điện thoại.

Muốn debug Python/Next ngoài Docker, dùng đúng runtime ghi trong `.python-version`/`.nvmrc`,
tạo venv và cài từ lock theo [upgrade local](handbook/guides/upgrade-latest.md)
và [local setup](handbook/guides/local-setup.md). Xem [testing](handbook/guides/testing.md)
để chuẩn bị PostgreSQL test riêng trước khi chạy integration.

## 3. Nhận một công việc có đầu ra rõ

Issue cần nêu vấn đề, phạm vi, acceptance criteria (AC), ảnh hưởng tenant/quyền/dữ liệu và cách kiểm tra.
Khi thiếu yêu cầu, ghi câu hỏi vào issue/trao đổi với chủ dự án trước khi đổi hành vi ngoài phạm vi.
Không coi toàn bộ đặc tả dài hạn là yêu cầu phải triển khai trong một PR.

Sau khi đã hiểu issue và cập nhật main local:

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/ISSUE-mo-ta-ngan
```

Dùng `fix/`, `docs/` hoặc `chore/` nếu phù hợp. Developer đóng góp qua branch và PR vào `main`;
chủ dự án có thể cho phép cập nhật trực tiếp cho một công việc cụ thể. Đây là quy trình làm việc,
không phải tuyên bố đã bật branch protection/CODEOWNERS trên GitHub.

## 4. Quy tắc khi sửa code

- Kiểm quyền ở API và giới hạn tài nguyên theo tenant; không tin tenant_id/role do client gửi.
- Web dùng session cookie, app dùng bearer token; không đưa admin key/server secret vào client.
- Đổi DB: sửa ORM, thêm migration mới và kiểm PostgreSQL thật. Không sửa revision đã áp dụng để thay lịch sử.
- Đổi yêu cầu/API/schema: cập nhật tài liệu hợp đồng, SRS/truy vết và test liên quan.
- Thêm/đổi tên/xóa file: cập nhật [bản đồ cấu trúc](handbook/guides/project-structure.md).
- Ưu tiên phiên bản stable mới nhất; rà tương thích, cập nhật lock/Docker/CI/tài liệu cùng nhau.
  Nếu SDK yêu cầu phiên bản thấp hơn, ghi rõ ngoại lệ, như React mobile theo Expo.
- Không chỉnh `node_modules`, output `.next` hoặc dependency bằng tay để chữa lỗi.
- Không tự triển khai production hoặc chạy script thử nghiệm lên dữ liệu thật.
- Extension manifest/metadata hiện tại không được dùng làm đầu vào để import/chạy code tùy ý.

## 5. Kiểm tra trước khi gửi PR

Chạy từ gốc repo trong venv Python đúng phiên bản, đã cài requirements và editable package:

```bash
ruff check .
python scripts/check_docs.py
python scripts/check_contracts.py
mkdocs build --strict
pytest -q -m 'not integration'
```

Thay đổi nghiệp vụ/DB phải chạy integration trên database test riêng theo testing guide;
đọc kỹ `scripts/test_postgres.py` vì có downgrade xóa schema database `yiedu_test`.
Không dùng SQLite thay bằng chứng cho JSONB/PostgreSQL.

Với web, chạy trong `web/`: `npm ci`, `npm run typecheck`, `npm run build` và browser journey
khi thay đổi luồng nghiệp vụ. Với mobile, chạy trong `mobile/`: `npm ci`, `npx expo install --check`,
`npm run typecheck` và bundle iOS/Android theo mobile guide. UI/native cần kiểm thiết bị khi phù hợp.
Sửa tài liệu thuần túy kiểm docs links/MkDocs; không cần viết unit test cho sửa chính tả.

CI hiện kiểm product, mobile, Compose và chuyển PostgreSQL. CI pass là bằng chứng kỹ thuật,
không tự thay thế UAT, review bảo mật hoặc nghiệm thu production. Không ghi “đã kiểm” nếu chưa chạy.

## 6. Commit và PR

Kiểm tra diff, chỉ stage file thuộc công việc, tránh thêm output hoặc secret:

```bash
git status --short
git diff
# Thay đường dẫn dưới đây bằng các file thực sự thuộc thay đổi.
git add duong/dan/file-da-sua
git commit -m "docs: explain tenant development flow"
git push -u origin HEAD
```

Mở PR vào `main` theo mẫu GitHub. Mô tả vấn đề, hành vi sau sửa, issue/FR liên quan,
lệnh kiểm tra và kết quả, ảnh minh họa nếu cần, migration/rollback và giới hạn còn lại.
Không kèm `.env`, cookie, bearer token hoặc backup database; che dữ liệu nhạy cảm trong screenshot/log.

Một công việc đủ điều kiện review khi: đáp ứng AC, kiểm tra liên quan đạt, tài liệu đồng bộ,
không mở rộng quyền ngoài tenant và có cách áp dụng/khôi phục nếu thay đổi dữ liệu.
Việc merge/chấp nhận cuối cùng theo phân công của chủ dự án. Xem [Git workflow](handbook/guides/git-workflow.md)
và [UAT](handbook/product/uat.md) cho bối cảnh quản lý dự án.

## Authoring Studio và module mở rộng

Đọc [SDK gadget/lesson tool](handbook/guides/authoring-sdk.md) và
[CR-002](handbook/product/changes/CR-002-authoring-i18n.md). Page gadget dùng GrapesJS,
lesson tool dùng Tiptap. Đăng ký module build-time tin cậy và đồng bộ validator/render/tests;
không import code từ ZIP/URL tenant. Thêm UI phải có nhãn VI/EN và giữ fallback nội dung cũ.


Module Content Studio: đọc [hướng dẫn tác giả và SDK](handbook/guides/content-studio.md) trước khi sửa thư viện slide/video/mô phỏng, media snapshot hoặc nâng học liệu.

Website Studio và bố cục khóa học/bài học: [hướng dẫn 0.7](handbook/guides/website-studio.md).

Nhóm template, Yoga, video ngoài và điều hướng theo URL: [hướng dẫn 0.8](handbook/guides/experience-yoga.md).
