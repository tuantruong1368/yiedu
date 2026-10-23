# Git và quy trình thay đổi

## Repo mới và repo local cũ

Repo GitHub đã xóa/tạo lại có thể có lịch sử hoàn toàn khác. Clone vào thư mục mới như README;
không force push từ thư mục cũ hoặc dùng `--allow-unrelated-histories` chỉ để hết lỗi.

## Cập nhật lần sau (sau khi đã clone repo mới)

```bash
git status --short --branch
git switch main
git pull --ff-only origin main
```

Nếu có thay đổi chưa commit, xem diff rồi lưu công việc trước khi pull. Không dùng reset --hard để bỏ lỗi.

## Làm một thay đổi

```bash
git switch -c docs/p0-review
git diff
python scripts/check_docs.py
mkdocs build --strict
git add handbook/learning-notes.md
git commit -m "docs: ghi nhận review P0 YiEdu"
git push -u origin docs/p0-review
```

Chỉ add file chủ đích. Không add `.env`, dữ liệu thật hoặc output có secret.
Tạo PR trên GitHub để xem diff và CI. Lần khởi tạo đưa trực tiếp main là yêu cầu riêng;
các thay đổi học tập sau nên dùng branch/PR để luyện review.

## Khi conflict

Đọc từng bên thay đổi, giữ ý nghĩa đúng, chạy kiểm tra rồi commit. Nếu chưa rõ, dừng và hỏi;
không chọn toàn bộ ours/theirs khi chưa hiểu. Git status là điểm bắt đầu kiểm tra.

## Commit, push và deploy

Commit lưu lịch sử local; push gửi lịch sử lên GitHub; deploy chạy phiên bản trên môi trường.
Push main trong repo này chỉ chạy CI, không tự deploy production.
