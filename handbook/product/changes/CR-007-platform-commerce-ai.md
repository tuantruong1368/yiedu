# CR-007 — Nhận diện, quản trị YiEdu, AI và thương mại

- Ngày: 25/10/2026.
- Nguồn: 7 yêu cầu của chủ YiEdu trong phiên làm việc hiện tại.
- Mục tiêu: tự quản giao diện/catalog, tạo học liệu AI có duyệt, bán khóa/lộ trình và thu phí tenant.
- Không thuộc thay đổi: cấu hình domain Mac đã hủy; production deployment; gửi email;
  tự tạo merchant/OpenAI account; ChatGPT OAuth chưa được cấp quyền thương mại.

## Quyết định triển khai

1. SVG nhận diện gốc dùng trong repo; full-width hero và responsive header.
2. Session role platform độc lập membership tenant, cấp/revoke bằng server console.
3. Template và appearance có revision; tenant giữ bản sao của nội dung đã tạo.
4. Credentials mã hóa Fernet bằng khóa riêng; không xuất secrets hoặc platform role.
5. AI sinh dữ liệu có schema và trạng thái review, không tự xuất bản hoặc gọi retry tính phí.
6. Seller-owned gateways cho khóa; platform gateways cho hóa đơn SaaS.
7. Tiền VND/USD số nguyên, giá/bundle/term snapshot, verification + idempotent settlement.
8. Trial 30 ngày theo owner anchor; monthly 30 ngày/yearly 365 ngày trả trước, yearly ×10.
9. Hết hạn giữ dữ liệu và quyền học đã có; quota chỉ hạn chế tạo/ghi danh mới.

## Tác động và truy vết

[FR-026–FR-032](../requirements.md), [traceability](../traceability-v2.md),
[migration/data model](../data-model.md), [API](../api-contract.md),
[release 0.9](../release-0.9.md), [hướng dẫn](../../guides/platform-commerce-ai.md).
Kiểm PostgreSQL upgrade/downgrade/schema, API ACL/commerce/AI, browser responsive và hành trình mua,
Next build, mobile typecheck/bundle, docs/contracts. Provider ngoài chỉ mock trong automated suite;
không đánh dấu live merchant/OAuth/production hoàn thành.
