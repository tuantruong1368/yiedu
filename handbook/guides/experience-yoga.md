# Trải nghiệm 0.8 — template, Yoga và điều hướng Studio

Ngày 24/10/2026. [Phạm vi](../product/release-0.8.md),
[yêu cầu/AC](../product/changes/CR-006-discovery-yoga-navigation.md).

## Cập nhật và thử tại local

Mở Docker Desktop, vào thư mục YiEdu:

```bash
git switch main
git pull --ff-only origin main
docker compose up --build -d
docker compose ps -a
```

Mở http://localhost:3000, Cmd+Shift+R nếu còn giao diện cũ. Bản 0.8 không thêm migration;
schema hiện tại vẫn `0005`. Giữ database và `.env`. Khóa học/website đã lưu không bị thay theo mẫu mới.

## Khám phá template

Thư viện có 15 mẫu, chia bảy nhóm và nút **Tất cả mẫu**:

| Nhóm | Mẫu |
|---|---|
| AI & Dữ liệu | Data Observatory |
| Lập trình & Cloud | Buildship, Software Faculty |
| Robotics & STEM | Future Lab, Yirobot, Engineering Foundation |
| Kinh doanh & Lãnh đạo | People Academy, Revenue School, Lead Forward |
| Yoga & Sống khỏe | An Nhiên Yoga |
| Ngoại ngữ | Language House |
| Sáng tạo & Giáo dục | Academy, Teacher Studio, Classroom Circle, Form & Function |

Nhóm đầu ưu tiên kỹ năng công nghệ đang được quan tâm, tham chiếu
[WEF Future of Jobs 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/).
Đây là lựa chọn biên tập theo nội dung catalog, không phải bảng xếp hạng lượt truy cập hoặc doanh thu.
Nhóm khác mở rộng theo mục đích xây học viện của khách hàng; không tạo nhóm trống.

Nhấn nhóm để lọc; nhập từ khóa có hoặc không dấu. Số kết quả cập nhật ngay.
URL `?group=wellness&q=an+nhien#templates` giữ bộ lọc khi quay lại hoặc tải lại.
Card đổi viền, bóng và nhấc nhẹ khi hover/focus; có chỉ dẫn xem trước. Trên màn hình chạm,
chỉ dẫn luôn hiện. Thiết lập giảm chuyển động của hệ điều hành được tôn trọng.
Các section dùng nền kem/xanh nhạt/lavender để phân vùng, card giữ nền sáng và chữ rõ.

## Xem đúng website sẽ tạo

Preview dùng cùng `SiteNavigation` với website tenant: logo/brand, menu, trang đang chọn,
nút khám phá bài học và menu gọn trên màn hình hẹp. Thanh công cụ riêng phía trên có
**Thư viện template**, tên mẫu, Desktop/Tablet/Mobile, Việt/Anh và **Chỉnh sửa website này**.

HTML/CSS render qua `/api/v1/catalog/templates/<id>/render?page=home&locale=vi`, cùng renderer
đã dùng cho website xuất bản. Card course dẫn đến bài trong preview; menu và CTA ở nội dung
được rewrite về template. `returnTo` giữ nhóm/từ khóa khi chuyển giữa các trang và trở lại thư viện.
Phần bài học chọn một bài để đọc, tránh khởi tạo nhiều editor/player cùng lúc.

## An Nhiên Yoga

Template `yoga-studio` có năm trang: trang chủ, khóa học, lộ trình 4 tuần, nhật ký thực hành
và giới thiệu. Giao diện xanh sage/kem/terracotta, minh họa SVG tự vẽ; sửa tiếp bằng Website Studio.

| Chuyên đề | Bốn bài |
|---|---|
| Tuần 1 · Bắt đầu vững vàng | Chuẩn bị, hơi thở tự nhiên, tư thế Núi, nhật ký và chọn mức tập |
| Tuần 2 · Nền tảng chuyển động | Mèo–Bò, điểm tựa vai/lưng, đứng có ghế hỗ trợ, chuỗi ngắn |
| Tuần 3 · Thực hành có hướng dẫn | Buổi 10 phút, chia nhỏ buổi nhập môn, yoga ghế, nghỉ cuối buổi |
| Tuần 4 · Xây thói quen riêng | Tự lập buổi tập, lịch/ngày nghỉ, tự đánh giá, kế hoạch sau khóa |

16 bài có chữ Việt/Anh, các bước thực hành, lựa chọn điều chỉnh, câu hỏi/đáp án và nhật ký.
Sáu video tiếng Anh được tái sử dụng có mục đích qua các buổi quan sát/thực hành:

| Video của Yoga With Adriene | Nguồn chính thức |
|---|---|
| Yoga For Complete Beginners | [Trang tác giả](https://yogawithadriene.com/yoga-complete-beginners/) |
| 10-Minute Yoga for Beginners | [Trang tác giả](https://yogawithadriene.com/10-minute-yoga-for-beginners/) |
| Tadasana (Mountain Pose) | [Trang tác giả](https://yogawithadriene.com/tadasana-mountain-pose/) |
| Cat-Cow Pose | [Trang tác giả](https://yogawithadriene.com/cat-cow-pose/) |
| Chair Yoga | [Trang tác giả](https://yogawithadriene.com/chair-yoga/) |
| 10-Minute Yoga For Self Care | [Trang tác giả](https://yogawithadriene.com/10-minute-yoga-for-self-care/) |

Nguồn được đối chiếu ngày 24/10/2026. Video nhúng từ YouTube, chỉ tải player khi người học bấm;
có liên kết mở nguồn nếu nhúng không hoạt động. Không tải lại hoặc phân phối file video của tác giả.
Chữ hướng dẫn là nội dung biên soạn riêng, không phải transcript hay bản dịch video.
Phụ đề/ngôn ngữ, khả năng phát và giới hạn khu vực do nguồn quyết định, cần kết nối Internet.
Mobile hiển thị chữ và nút mở video nguồn; chưa có player YouTube native trong ứng dụng.

Khóa là nhập môn vận động tổng quát, có lựa chọn ghế và khoảng nghỉ; không hứa hẹn chữa bệnh,
giảm cân hay cấp chứng chỉ giảng viên. Hướng dẫn an toàn tham chiếu
[NCCIH](https://www.nccih.nih.gov/health/yoga-effectiveness-and-safety).
Người có chấn thương, bệnh nền, đang mang thai hoặc có hạn chế riêng cần hướng dẫn phù hợp.
Chưa có chuyên gia nghiệm thu toàn bộ giáo trình hoặc quan sát kỹ thuật người tập.

**Dùng thử:** chọn Yoga & Sống khỏe → An Nhiên Yoga → Chỉnh sửa website này → xuất bản.
Khi bật sao chép nội dung mẫu, tenant có riêng 4 khóa, 16 bài, 1 lộ trình và 16 project media VI/EN.
Học viên đăng ký/tham gia, ghi danh chuyên đề, mở bài, đọc/xem và ghi tiến độ. Xuất bản lại không nhân đôi.

## Quản trị và Content Studio

Sidebar chỉ có một `TenantBrand`; dưới là nhãn vai trò, không lặp avatar/brand thứ hai.
Nhấn **Studio nội dung** giữ sidebar và mở thư viện trong panel phải. Chỉ các công cụ
**Soạn bài**, **Tạo slide**, **Tạo video**, **Tạo mô phỏng** mở editor toàn màn hình.
Project có tìm kiếm/lọc loại; danh sách bài có bộ lọc khóa học riêng và nút xem thêm.

| Đi từ | Nút quay lại đưa về |
|---|---|
| Thư viện template đã lọc → xem mẫu | Cùng nhóm và từ khóa |
| Admin → Studio → công cụ | Studio đúng loại/từ khóa/khóa đang lọc |
| Khóa/bài đang sửa → editor lesson | Cùng khóa và bài |
| Editor bài giảng → công cụ khác | Editor trước đó, có ngữ cảnh quay về thư viện |
| Học viên → bài học → danh sách | Khóa vừa học; URL bài tải lại được |

Editor bảo vệ thay đổi chưa lưu, giữ nháp và revision. Khi tạo mới rồi lưu, URL chuyển sang ID
đã lưu bằng history API, giữ nguyên editor/player và thông báo lưu. Reload vẫn mở đúng dữ liệu server.
Các `returnTo` được kiểm tra cùng tenant; link ngoài hoặc tenant khác bị thay bằng đích an toàn.
Tab quản trị ghi URL; Back/Forward theo đúng panel. Đăng nhập lại từ quản trị/Studio giữ đích cùng tenant và bộ lọc, không đưa về Tổng quan hoặc Khu học tập ngoài ý muốn. Đường dẫn Studio thư viện cũ chuyển về `?tab=studio`.

## Tối ưu độ ổn định

- Bộ lọc phản hồi ngay; ghép thay đổi từ URL hiện tại để thao tác nhanh không ghi đè nhau.
- Với Next, history API nhận `null`; truyền nguyên `history.state` sẽ bỏ qua đồng bộ router.
- Bỏ remount iframe lần hai khi mount; liên kết nội bộ dùng router/Link thay tải lại toàn tài liệu.
- Dùng font hệ thống và scrollbar ổn định; không chờ Google Fonts hoặc swap font làm đổi bố cục.
- Skeleton giữ cấu trúc sidebar/header; Studio tải các dữ liệu độc lập song song và biết tenant từ server.
- Video chỉ nạp player khi bấm; ảnh poster lỗi được ẩn, luôn có đường dẫn nguồn.
- Có trang 404 và lỗi có nút thử lại/đi tiếp; không hiển thị chi tiết exception nội bộ.

Đây là các sửa đổi có kiểm thử theo luồng; không có benchmark trên mọi thiết bị/mạng/trình duyệt.
Không khẳng định loại bỏ mọi giật hình trong môi trường chưa đo.

## Đóng gói và điểm mở rộng

Docker web chép `public/`; CI Compose kiểm tải SVG. ZIP standalone gồm SVG và source mobile,
ngoài source API/web và snapshot trước đây. Video vẫn là tham chiếu ngoài; APK/IPA ký và store riêng.

| File | Trách nhiệm |
|---|---|
| `content/template-groups.json`, `content/yoga.json` trong backend | Nhóm, mẫu Yoga, giáo trình, video và VI/EN |
| `backend/yiedu/yoga_site.py` | HTML/CSS năm trang Yoga, có container cho course gadget |
| `web/components/site-navigation.tsx` | Brand/menu chung tenant và preview, menu màn hình nhỏ |
| `web/components/studio/studio-library.tsx` | Thư viện nhúng trong AdminScreen |
| `web/lib/navigation.ts`, `web/lib/use-url-filters.ts` | Return URL cùng tenant và bộ lọc đồng bộ URL |
| `web/components/lesson/external-video.tsx` | Player theo yêu cầu và nguồn ngoài |
| `web/app/experience.css` | Giao diện discovery/preview/library và giảm chuyển động |
| `web/public/illustrations/yoga-practice.svg` | Asset minh họa gốc, được đóng gói Docker/ZIP |
| `web/tests/experience.spec.ts` | Nhóm, preview, context/Back, Yoga learner và return URL |

Giữ schema SiteDocument 2.0, Tiptap, snapshots và ACL/revision hiện hành.
Không thêm AI provider, billing, upload media storage hoặc quiz tự chấm trong đợt này.
