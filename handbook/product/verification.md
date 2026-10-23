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
| PostgreSQL integration trong GitHub Actions | Đang chờ chạy sau khi push |
| UAT / Mac / staging / production | Chưa thực hiện |

Có cảnh báo tương thích chuyển tiếp Starlette TestClient/httpx; 4 test vẫn pass.
Dependency được chốt phiên bản tại requirements.lock. CI cài lại từ file này.

Không dùng các kết quả bộ nền để kết luận đã đạt tenant auth/RLS, hiệu năng, thanh toán hoặc export.
CI kiểm migration upgrade/downgrade/upgrade trên DB tạm, drift check và test tenant/course.
