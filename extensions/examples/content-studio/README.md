# Content Studio contribution

Ví dụ metadata cho ba module độc lập: slide, video theo cảnh và mô phỏng.
Các module chạy thật nằm trong `web/lib/studio/registry.tsx`, `web/components/studio/`
và được kiểm tra bằng `backend/yiedu/studio_schema.py`.

Đọc [Content Studio SDK](../../../handbook/guides/content-studio.md). Developer thêm công cụ
bằng source module đã review, UI biên tập, player, schema validator và kiểm thử tenant/export.
Manifest không cài hoặc chạy mã từ người dùng; quyền mua bán và phân phối package chưa có.
