# Bài thực hành đầu tiên: từ yêu cầu đến bằng chứng

Mục tiêu: anh thấy được mối liên hệ giữa quản lý dự án, API và database mà chưa cần viết thêm code.
Đầu vào: đã hoàn thành local setup. Không dùng dữ liệu khách hàng thật.

## 1. Đọc yêu cầu

Mở `handbook/product/requirements.md`, tìm FR-001 và quy tắc course slug.
Viết vào learning-notes: người dùng là ai, giá trị là gì, có những tình huống lỗi nào.
Lưu ý API hiện tại dành cho platform admin, chưa phải onboarding tự phục vụ.

## 2. Tạo dữ liệu

Mở `/docs`, Authorize bằng key local. POST tenant có slug `lab-trung-tam-a`.
Ghi ID trả về. POST lại cùng payload: mong đợi 409.
Tạo tenant B với slug khác. Tạo course slug `python-co-ban` trong cả hai tenant: đều được.
POST course cùng slug lần hai trong tenant A: mong đợi 409.

## 3. Quan sát database

```bash
docker compose exec db psql -U yiedu -d yiedu -c 'SELECT id, slug, name FROM tenants;'
docker compose exec db psql -U yiedu -d yiedu -c 'SELECT tenant_id, slug, title FROM courses;'
```

Nếu anh đổi user/database trong `.env`, sửa tham số tương ứng. Hai lệnh chỉ đọc dữ liệu.
Đọc unique constraint trong migration và liên hệ lỗi 409.

## 4. Kiểm thử và truy vết

```bash
pytest -q -m 'not integration'
python scripts/check_docs.py
```

Đọc integration test để thấy cách chứng minh quy tắc với DB thật. Chạy theo testing guide khi
đã có DB test riêng. Ghi kết quả thực tế, không ghi “đạt bảo mật tenant” từ bài lab admin này.

## 5. Ghi nhận như một công việc dự án

Tạo ghi chú có mục tiêu, bước thực hiện, kết quả, bằng chứng và câu hỏi.
Nếu lỗi khác mong đợi, dùng mẫu issue: không sửa ngẫu nhiên cho đến khi hết lỗi.
Hoàn tất khi anh giải thích được FR → constraint → HTTP status → test, và vì sao admin key không cấp cho learner.
