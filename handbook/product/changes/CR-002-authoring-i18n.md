# CR-002 — Đa ngôn ngữ và hệ thống authoring mở rộng

Ngày 24/10/2026. Chủ dự án yêu cầu sửa trực tiếp main: VI/EN, editor chất lượng cao,
import website code thành template, branding/logo, gadget kéo thả/resize/events, page/menu,
điều hướng người đã login và rich lesson với công cụ developer có thể phân phối thương mại về sau.

| ID | Tiêu chí chấp nhận | Điểm triển khai/kiểm tra |
|---|---|---|
| FR-026 | Chọn VI/EN và giữ lựa chọn khi reload; biên tập page/lesson theo ngôn ngữ | locale-provider, i18n dictionaries, mobile i18n; authoring.spec |
| FR-027 | Chọn gadget, chỉnh panel trái, position/resize/zoom, clone/delete | GrapesJS builder, gadgets registry; browser/manual canvas |
| FR-028 | Dán HTML/CSS → component tree, lưu/publish, không thực thi script nhập vào | normalize/sanitize helpers, authoring.py; sanitizer unit + browser import |
| FR-029 | Sửa/logo từ chữ/ảnh, admin/learn chỉ dùng branding tenant | Branding schema, TenantBrand/LogoMark, site/admin/learn; browser white-label |
| FR-030 | Gadget mẫu và declarative events, developer có API đăng ký gadget | gadgets.ts, events bridge, ExtensionManifest.editor_contributions; metadata validator |
| FR-031 | Thêm page/menu và mở được URL trang con VI/EN | SiteDocument pages/menu, route /p/[page]; browser pages/events |
| FR-032 | Login chọn template vào builder, guest vẫn đăng ký | TemplateLink; browser auth journey |
| FR-033 | Bài học lưu/read được rich document và translation, quyền body được giữ | Alembic 0003, LessonWrite, Tiptap; PostgreSQL integration + rich browser journey |
| FR-034 | Developer đăng ký tool/math/simulation và metadata commercial | LessonTool registry, extension sample; chưa phải marketplace/AI provider hoàn chỉnh |

Thay đổi kỹ thuật: editor page chuyển Puck → GrapesJS nhưng giữ renderer legacy; lesson chuyển textarea →
Tiptap; workspace document thêm schema 2.0; DB thêm lesson.document/translations; snapshot version 0003.
Yêu cầu mua bán và AI được ghi nhận là phần tiếp theo, không suy ra đã có dịch vụ vì metadata/registry đã tồn tại.
Chi tiết phạm vi [release 0.4](../release-0.4.md); hướng dẫn [SDK](../../guides/authoring-sdk.md).
