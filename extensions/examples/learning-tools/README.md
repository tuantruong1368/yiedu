# Editor contribution example

Manifest minh họa package có page-gadget và lesson-tool; `commercial` là metadata cho cơ chế
license/entitlement về sau, chưa có thanh toán hoặc cài artifact. Không có quyền thực thi từ metadata.
API contribution 1.0.0 là hợp đồng registry editor, khác extension_api 0.1.0 của manifest thử nghiệm.

Developer viết module tin cậy gọi `registerGadget()` trong `web/lib/authoring/gadgets.ts` hoặc
`registerLessonTool()` trong `web/lib/authoring/lesson-tools.tsx`, import module lúc build editor,
cập nhật validator/render/tests trước khi phát hành. Không import module từ URL/ZIP của tenant.
Xem Handbook `guides/authoring-sdk.md` để biết ví dụ đầy đủ và vòng đời review/distribution.
