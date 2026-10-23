# Hướng dẫn làm việc với YiEdu
- Đọc README.md và handbook/product/status.md trước khi sửa.
- Handbook bằng tiếng Việt; sản phẩm public dự kiến hỗ trợ Việt/Anh.
- FastAPI và PostgreSQL đã chốt. Các lựa chọn khác xem decision-log.md.
- Không đánh dấu mục hoàn thành nếu thiếu bằng chứng. Không biến giả định thành quyết định.
- Sửa yêu cầu/API/schema thì cập nhật tài liệu truy vết và migration tương ứng.
- Không commit secret, .env, dữ liệu cá nhân; không tự triển khai production.
- API /tenants cũ là platform-admin; product /runtime dùng membership/session. Không đưa admin key vào frontend/mobile.
- Kiểm tra: python scripts/check_contracts.py; ruff check .; python scripts/check_docs.py; mkdocs build --strict; pytest -q.
- Thay đổi DB chạy migration và PostgreSQL integration test; không dùng SQLite thay thế để chứng minh JSONB.
- Mỗi thay đổi nêu vấn đề, kết quả, lệnh kiểm tra và giới hạn.

- Phạm vi hiện tại: handbook/product/vision-v2.md và traceability-v2.md. Đừng đánh đồng spec/metadata validator với installer hoặc runtime extension.

- Bản triển khai hiện tại: handbook/product/release-0.3.md. Kiểm Next build/browser và Expo typecheck/bundle khi sửa client.
