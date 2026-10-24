# Authoring Studio 0.4 — sử dụng và mở rộng

Ngày 24/10/2026. Đây là hướng dẫn cho phần **đã có code** của builder/bài học;
không phải thông báo marketplace, AI service hoặc installer thương mại đã hoàn thành.
[Thay đổi yêu cầu](../product/changes/CR-002-authoring-i18n.md), [trạng thái 0.4](../product/release-0.4.md).

## 1. Lựa chọn editor

Builder dùng GrapesJS 0.23.8: component tree từ HTML/CSS, blocks, traits, Style Manager,
layers, thiết bị, drag mode và canvas zoom. Lesson editor dùng Tiptap 3.32.0/ProseMirror:
rich document, bảng, checklist, code, image/video, công thức và custom node.
Không có một bộ editor “tốt nhất cho mọi mục đích”; hai bộ này phù hợp với các hành vi đang yêu cầu
và cho phép phát triển module trong mã nguồn. Không cần tài khoản Studio SDK/Tiptap Cloud trả phí.

KaTeX dùng 0.18.10, bản không deprecated mới nhất trong peer range của extension toán Tiptap.
KaTeX 0.19.1 là bản mới hơn nhưng ngoài peer range; 0.18.11 bị upstream đánh dấu deprecated.
Không dùng force/legacy-peer-deps để bỏ qua xung đột. Khi nâng Tiptap, rà lại điều kiện này.
Nguồn: [GrapesJS](https://grapesjs.com/docs/),
[Tiptap extensions](https://tiptap.dev/docs/editor/core-concepts/extensions),
[Tiptap mathematics](https://tiptap.dev/docs/editor/extensions/nodes/mathematics).

## 2. Thao tác trên builder

Người đã đăng nhập nhấn template trên homepage sẽ được tạo workspace và mở builder trực tiếp.
Người chưa đăng nhập tiếp tục qua đăng ký. Tên/slug mặc định của workspace mới có thể sửa;
slug đã xuất bản vẫn khóa để tránh tự đổi địa chỉ tenant.

Thanh trên có lưu nháp, publish, undo/redo, chọn page, thêm page, ngôn ngữ nội dung,
Desktop/Tablet/Mobile, zoom 25–200% và import HTML/CSS. Chọn gadget trên canvas để mở panel trái:
thuộc tính HTML, Style Manager, position, sự kiện, nhân bản, thêm con, xóa.

- `Flow/Responsive`: bố cục tài liệu HTML thông thường.
- `Free/Absolute`: kéo tự do theo tọa độ; resize bằng tay nắm hoặc width/height ở panel.
- `Fixed`: ghim theo viewport của trang render; `relative` và `sticky` cũng có thể chọn.
- Background/image/font/padding/margin/border chỉnh trong Style Manager. Để thiết kế responsive,
  kiểm cả ba viewport; absolute/fixed không tự đảm bảo đẹp trên mọi kích thước màn hình.
- Chỉ inspector scroll khi có nhiều thuộc tính; tab Layers giúp chọn phần tử bị che phía dưới.

Gadget mẫu đã đăng ký: section/background, columns, text/heading, button, image, video,
audio, text-logo, divider, spacer, course list, form, FAQ, testimonial và links.
Media mẫu dùng URL ngoài. Image/asset manager hỗ trợ URL; upload media storage server chưa triển khai.

Tab Trang/Menu/Logo cho phép thêm/xóa trang (giữ homepage), đổi title/slug, sửa/thêm/xóa/sắp menu,
chọn page đích và chỉnh logo. Page thêm có URL `/t/<tenant>/p/<page-slug>`.
Menu có nhãn riêng cho Việt/Anh; mỗi page có HTML/CSS riêng cho mỗi ngôn ngữ.
Giao diện ứng dụng và ngôn ngữ **nội dung đang biên tập** là hai bộ chọn khác nhau.

Logo có thể là URL HTTPS hoặc ảnh PNG/JPEG/WebP tối đa 200KB tải vào document.
Nếu chưa có logo, nhập chữ thương hiệu để tạo monogram với kiểu rounded/circle/square và màu riêng.
Đây là tạo logo chữ bằng thuật toán bố cục, không phải gọi AI vẽ logo. Logo/name tenant thay branding
YiEdu trên public/admin/learn. Logo của tenant chưa được ánh xạ sang icon app riêng trên app store.

## 3. Import website thành template

Dán HTML đã render và CSS vào hai ô import rồi chọn Phân tích thành template.
Style tag trong HTML được tách lấy CSS. GrapesJS phân tích thành component tree để chọn/kéo/sửa.
Bước này thay nội dung của **page/ngôn ngữ hiện tại**; có thể undo, và chưa ghi lên server cho đến khi lưu.

Chỉ hỗ trợ phần HTML/CSS tĩnh. React/Vue/PHP cần xuất DOM/HTML trước; không tự tái tạo backend,
JavaScript tương tác, font/assets tương đối hoặc mọi layout của mọi website một cách hoàn hảo.
Dùng tài nguyên/template có quyền sử dụng. Thay đường dẫn asset tương đối bằng URL HTTPS phù hợp.
Không có server fetch URL website, crawler, thực thi JavaScript nhập vào hoặc AI reverse-engineering.

Client dùng DOMPurify, API dùng nh3 và tinycss2: loại script/handler HTML, iframe/object/embed,
URL nguy hiểm và CSS @import; chỉ giữ thành phần/thuộc tính cho phép. Không bỏ validator để “import giống hơn”.
Dữ liệu client gửi không được coi là tin cậy. Page public được render trong iframe sandbox/CSP,
CSS không lan vào admin, mã nhập không được quyền truy cập cookie/token của ứng dụng.
SEO hiện có metadata server theo page; nội dung canvas sandbox chưa tối ưu SEO tương đương HTML SSR trực tiếp.

## 4. Sự kiện gadget

Mỗi phần tử có một event chính và tối đa tám event bổ sung. Event: click, dblclick, mouseenter,
mouseleave, change, submit. Action: message, navigate, scroll, toggle. Target là HTTPS/path nội bộ
hoặc element ID theo action; có trường message. Không có ô nhập JavaScript, eval hay truy cập secret.

Ví dụ button hiển thị thông báo và mouseenter cuộn tới một section:

```html
<button data-event="click" data-action="message" data-message="Xin chào"
 data-events='[{"event":"mouseenter","action":"scroll","target":"courses"}]'>
 Khám phá
</button>
```

Runtime tin cậy gắn handler trong iframe; bridge chỉ nhận message từ đúng iframe hiện tại và
chỉ điều hướng HTTPS/path đã kiểm tra. Form mẫu chặn gửi network và hiển thị thông báo;
chưa có form submission service/email/CRM. Không thu dữ liệu người dùng bằng event giả vờ đã gửi.

## 5. Dữ liệu site và tương thích

Workspace `data` và tenant `published_page` dùng JSONB, schema `2.0`, engine `grapesjs`:

```json
{
  "schema_version":"2.0","engine":"grapesjs","default_locale":"vi",
  "branding":{"text":"My School","logo_url":"","color":"#215d4c","variant":"rounded"},
  "pages":[{"id":"home","slug":"","title":{"vi":"Trang chủ","en":"Home"},
    "vi":{"html":"<h1>Xin chào</h1>","css":""},
    "en":{"html":"<h1>Hello</h1>","css":""}}],
  "menu":[{"id":"main","page_id":"home","label":{"vi":"Trang chủ","en":"Home"}}]
}
```

Tối đa 20 page, menu phải tham chiếu page tồn tại, ID/slug không trùng, có đúng một homepage slug rỗng.
API giới hạn JSON document 1.5MB và giới hạn từng HTML/CSS; ảnh logo nhúng chiếm một phần dung lượng này.
Giữ revision để chống ghi đè workspace từ hai cửa sổ.

Puck document cũ vẫn được API nhận và public render. Khi mở builder mới, `normalizeSite()` chuyển
các block Hero/Text/Courses/Stats sang HTML; dữ liệu mới chỉ được lưu khi người dùng nhấn lưu/publish.
Không có migration hàng loạt đổi mọi trang tenant hoặc xóa document cũ trong DB.
HTML/CSS là nguồn lưu, không nhận GrapesJS project có script của tenant.

## 6. Developer tạo gadget

Registry ở `web/lib/authoring/gadgets.ts`, hàm `registerGadget()`, manifest có packageId/version,
kind, label Việt/Anh, category, license, capability và HTML content.
Đăng ký module tin cậy trước khi `installGadgets()` chạy:

```ts
import {registerGadget} from '@/lib/authoring/gadgets';
registerGadget({
  packageId:'acme.call-to-action',version:'1.0.0',kind:'page-gadget',
  label:{vi:'Lời kêu gọi',en:'Call to action'},category:'interactive',
  license:'free',capabilities:['page:render','events:declarative'],
  content:'<section><h2>Learn with us</h2><a class="yd-button" href="#courses">Explore</a></section>'
});
```

Import module ở entry registry/builder trong lúc build. Có thể khai `setup(editor)` để đăng ký
component type/trait chuyên biệt qua API GrapesJS trước khi nạp page. Muốn có tag/thuộc tính/action mới,
cập nhật schema/allowlist trong `backend/yiedu/authoring.py`, renderer và test tương ứng.
Không chỉ đổi client để vượt giới hạn API. Gadget hiện dựa trên HTML/style/traits; chưa có npm package
SDK được phát hành hoặc cài gadget tùy ý từ giao diện tenant.

## 7. Bài học phức tạp và công cụ developer

Admin khóa học dùng Tiptap thay textarea. Có heading, bold/italic, list, link, undo/redo,
bảng và thao tác hàng/cột/cell, image URL, YouTube, checklist, code block, công thức LaTeX,
callout và mô phỏng sóng sin thật có thanh điều khiển. Công thức dùng KaTeX `trust:false`.
VI/EN có tài liệu riêng; trường text được lưu kèm để client chưa hỗ trợ rich document vẫn đọc được.

`Lesson.document` là Tiptap JSON mặc định; `Lesson.translations.en` có title/content/document tiếng Anh.
Migration 0003 chỉ thêm cột document nullable và translations mặc định `{}`, không xóa nội dung cũ.
API validate node/mark, URL, độ sâu, kích thước và tham số mô phỏng. Client chỉ mở body sau kiểm
membership/enrollment/prerequisite; overview không trả document/translations để tránh lộ bài học chưa được phép đọc.

Registry `web/lib/authoring/lesson-tools.tsx` cung cấp `registerLessonTool()`, `lessonTools()` và
`lessonExtensions()`. Tool có manifest và hàm insert; có thể bổ sung Tiptap extension/node view.
Mô phỏng là mẫu triển khai thực tế: ReactNodeViewRenderer, attrs amplitude/frequency,
render SVG và chỉnh tham số. Viewer web dùng cùng registry ở chế độ read-only, vẫn cho học viên tương tác
với mô phỏng cục bộ. Native app hiện dùng nội dung text/video fallback, chưa render mọi custom node tương tác.

Ví dụ một công cụ không tạo node mới:

```ts
import {registerLessonTool} from '@/lib/authoring/lesson-tools';
registerLessonTool({
 packageId:'acme.reflection',version:'1.0.0',label:{vi:'Tự đánh giá',en:'Reflect'},
 license:'free',capabilities:['lesson:render'],
 insert:editor=>{editor.chain().focus().insertContent('<blockquote>What did you learn?</blockquote>').run();}
});
```

Với node mới: đăng ký extension vào registry, thêm node/attrs vào validator server, bảo đảm export/restore
và viewer nhận được, viết test và khai báo portable/schema version. Không tải node code từ lesson JSON.
Nút AI hiện báo chưa cấu hình provider; interface tool cho phép tích hợp sau, không gọi AI hoặc gửi dữ liệu ra ngoài.
Mọi AI thật cần backend/provider secret, quyền tenant, giới hạn chi phí và xác nhận kết quả từ người soạn.

## 8. Đóng gói để phân phối/mua bán về sau

Manifest extension có `editor_contributions`: id, slot page-gadget/lesson-tool, api_version 1.0.0,
export_name, license free/commercial và props_schema. Ví dụ trong `extensions/examples/learning-tools/`.
API manifest `0.1` và extension_api `0.1.0` hiện chỉ là hợp đồng metadata, khác version registry editor.
Developer portal nhận metadata; việc khai commercial không tự tạo giá, license hoặc quyền chạy.

Vòng đời thương mại cần làm tiếp: artifact có chữ ký → review/build tin cậy → catalog version →
checkout/entitlement theo tenant → cài phiên bản tương thích → rollback/data migration → portable license.
Chưa có các dịch vụ thanh toán, installer, entitlement enforcement hoặc payout. Không cho tenant tải ZIP
vào editor rồi chạy tùy ý. Mọi module hiện hoạt động vì được tích hợp và kiểm tra trong codebase.

## 9. Chạy lại local và nghiệm thu

Máy đã chuyển PostgreSQL 18 theo hướng dẫn lần trước:

```bash
git switch main
git pull --ff-only origin main
mkdir -p backups
umask 077
docker compose exec -T db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" -d "$POSTGRES_DB"' > "backups/before-authoring-$(date +%Y%m%d-%H%M%S).dump" &&
docker compose up --build -d
docker compose ps
```

Không chia sẻ backup hoặc dùng down -v. Nếu còn PostgreSQL 17, theo [upgrade](upgrade-latest.md)
để chuyển trước. Compose tự chạy Alembic 0003. Không cần chạy lại script chuyển 17 → 18 khi đã ở 18.
Đổi dependency web thì image cần build lại; không chỉ restart container cũ.

Tiêu chí thực hành: đổi UI EN/VI và reload, chọn template khi đang login, import static HTML/CSS,
chọn/resize/di chuyển gadget, thêm event, thêm page/menu, sửa logo, publish rồi mở hai ngôn ngữ,
kiểm tenant admin/learn không có branding YiEdu. Tạo lesson có text/math/table/simulation, lưu và mở bằng
learner khác; tài khoản ngoài tenant và học viên chưa enroll phải bị từ chối đọc body.

Kiểm tra tự động: `pytest -q`, `npm run build`, `npm run test:e2e`, mobile typecheck/bundle,
`python scripts/check_docs.py`, `python scripts/check_contracts.py`, `mkdocs build --strict`.
Dùng PostgreSQL test riêng khi chạy integration; xem [testing](testing.md).
