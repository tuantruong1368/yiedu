# Nghiên cứu chính thức và quyết định áp dụng

Kiểm tra ngày 23/10/2026. Các nguồn dưới đây là tham khảo, không phải bằng chứng YiEdu đã có tính năng.

| Chủ đề | Kết quả nguồn chính thức | Áp dụng đề xuất cho YiEdu |
|---|---|---|
| Phiên bản Joomla | Trang Downloads công bố Joomla 6.2.0, ngày 13/10/2026 | Mốc tham chiếu trải nghiệm CMS hiện đại |
| Tài liệu Joomla | Manual vẫn gắn 6.1 Current/6.2 Upcoming khi kiểm tra | Ghi nhận lệch nhãn; lấy Downloads cho release, manual cho cơ chế |
| Extension manifest | Joomla dùng XML cho component/module/plugin/template | YiEdu JSON contract riêng, không tương thích ZIP Joomla |
| Plugin event | Joomla có event/subscriber | Event API có version và tenant context, không copy PHP runtime |
| Update server | Catalog version, ràng buộc và link artifact | Registry ký release, kiểm tương thích và recovery |
| OAuth | Firebase hỗ trợ Google/Facebook/email | Là một provider ứng viên; FastAPI vẫn kiểm token và membership |
| Wildcard hosting | Cloud Run domain mapping có giới hạn wildcard | Đánh giá gateway/load balancer + wildcard DNS/TLS, chưa triển khai |
| Mobile distribution | Apple có quy định cho template apps và phần mềm/plugin trong app | Ưu tiên app học chung, không coi plugin web là native feature tự tải |

## Nguồn

- [Joomla latest release](https://downloads.joomla.org/us/latest)
- [Joomla manifest](https://manual.joomla.org/docs/next/building-extensions/install-update/installation/manifest/)
- [Joomla update server](https://manual.joomla.org/docs/next/building-extensions/install-update/update-server/)
- [Joomla plugin events](https://manual.joomla.org/docs/next/building-extensions/plugins/how-plugins-work/)
- [Firebase authentication methods](https://firebase.google.com/docs/auth/web/start)
- [Facebook provider setup](https://firebase.google.com/docs/auth/web/facebook-login)
- [Backend token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Cloud Run domain mapping](https://docs.cloud.google.com/run/docs/mapping-custom-domains)
- [Google Cloud URL maps](https://docs.cloud.google.com/load-balancing/docs/url-map-concepts)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## Kết luận kỹ thuật

Không cần xóa repo; giữ FastAPI/PostgreSQL và tách core/content/extension từ thiết kế.
Không lấy Joomla làm framework backend cho code Python. Cần các spike: auth/mobile với standalone,
Puck SSR/override, wildcard routing, signed updates/recovery và host cô lập extension.
Các mục tiêu user đã nêu là yêu cầu sản phẩm; các công nghệ chưa chốt giữ trạng thái đề xuất.
