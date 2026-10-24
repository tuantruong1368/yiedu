# Truy vết yêu cầu v0.2

ID cũ FR-001–014 giữ nguyên. Bảng này liên kết phạm vi mới với backlog, AC và UAT.

| FR | Tài liệu/AC | Backlog | Test | UAT | Triển khai |
|---|---|---|---|---|---|
| FR-015 | [Onboarding](onboarding-builder.md) AC-015 | BL-017, BL-018 | TC-015 | UAT-07 | Chưa |
| FR-016 | [Builder](onboarding-builder.md) AC-016 | BL-018 | TC-016 | UAT-07 | Chưa |
| FR-017 | [Subdomain](onboarding-builder.md) AC-017 | BL-019 | TC-017 | UAT-07 | Chưa |
| FR-018 | [Admin/path](identity-mobile.md) AC-018 | BL-020 | TC-018 | UAT-08 | Chưa |
| FR-019 | [Identity/app](identity-mobile.md) AC-019 | BL-017, BL-021 | TC-019 | UAT-09 | Chưa |
| FR-020 | [ZIP](standalone-export.md) AC-020 | BL-023 | TC-020 | UAT-10 | Chưa |
| FR-021 | [Updater](updates.md) AC-021 | BL-024 | TC-021 | UAT-11 | Chưa |
| FR-022 | [Extension](extensions.md) AC-022 | BL-025 | TC-022 | UAT-12 | Chưa |
| FR-023 | [Marketplace](marketplace.md) AC-023 | BL-026, BL-027 | TC-023 | UAT-13 | Chưa |
| FR-024 | [SDK](extensions.md) AC-024 | BL-022, BL-026 | TC-024 | UAT-12, UAT-13 | Chỉ metadata validator/examples |
| FR-025 | AC-017-01/03, AC-020-02, AC-021-03 | BL-019, BL-023, BL-024 | TC-017/020/021 | UAT-07/10/11 | Chưa |

Trạng thái đặc tả không bằng trạng thái code. Validator chỉ kiểm subset metadata của FR-024;
không đạt AC registry dependency/signature hoặc khả năng thực thi/cô lập extension.

## Mức triển khai 0.3

Đặc tả mục tiêu ở trên vẫn giữ nguyên. Đọc [ma trận 0.3](release-0.3.md) để biết subset đã có code,
phần chưa triển khai và kiểm tra thực tế; không diễn giải toàn bộ spec thành tính năng đã chạy.

## Cập nhật authoring 0.4 — 24/10/2026

[CR-002: FR-026–034](changes/CR-002-authoring-i18n.md) và [trạng thái 0.4](release-0.4.md)
quản lý phần đa ngôn ngữ, builder mới và công cụ tạo bài học.
Workspace data chấp nhận Puck cũ hoặc SiteDocument 2.0 (pages/menu/branding/VI/EN);
LessonWrite/lesson response thêm document và translations. Alembic 0003 thêm JSONB document nullable,
translations mặc định {}; body/document/translation không trả trong overview cho học viên.
Snapshot mới 0003, restore nhận 0002/0003.
GrapesJS được chọn cho HTML/CSS/free layout; Tiptap cho rich lesson và extension node.
EditorContribution chỉ khai báo module/slot/license; không cấp quyền thực thi hoặc chứng minh đã mua.
