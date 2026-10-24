import type { Editor } from "grapesjs";
export type GadgetDefinition = {
  packageId: string;
  version: string;
  kind: "page-gadget";
  label: { vi: string; en: string };
  category: "layout" | "content" | "media" | "interactive" | "sections";
  content: string;
  setup?: (editor: Editor) => void;
  license: "free" | "commercial";
  capabilities: string[];
};
const gadgets: GadgetDefinition[] = [];
const booted = new WeakSet<Editor>();
export function registerGadget(def: GadgetDefinition) {
  if (
    !/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(def.packageId) ||
    gadgets.some((g) => g.packageId === def.packageId)
  )
    throw new Error("Invalid or duplicate gadget");
  gadgets.push(def);
}
const samples: [
  string,
  string,
  string,
  GadgetDefinition["category"],
  string,
][] = [
  [
    "section",
    "Vùng nền",
    "Background section",
    "layout",
    '<section class="yd-background"><h2>Tiêu đề / Heading</h2><p>Thêm nội dung / Add content</p></section>',
  ],
  [
    "columns",
    "Hai cột",
    "Two columns",
    "layout",
    '<section class="yd-columns"><div>Column 1</div><div>Column 2</div></section>',
  ],
  [
    "text",
    "Văn bản",
    "Text",
    "content",
    '<div style="padding:16px"><h2>Heading</h2><p>Double click to edit / Nhấp đúp để sửa.</p></div>',
  ],
  [
    "button",
    "Nút bấm",
    "Button",
    "interactive",
    '<a class="yd-button" href="#courses">Khám phá / Explore</a>',
  ],
  [
    "image",
    "Hình ảnh",
    "Image",
    "media",
    '<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800" alt="Learning" style="width:400px"/>',
  ],
  [
    "video",
    "Video",
    "Video",
    "media",
    '<video controls style="width:480px;max-width:100%"><source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4"/></video>',
  ],
  ["audio", "Âm thanh", "Audio", "media", "<audio controls></audio>"],
  [
    "logo",
    "Logo chữ",
    "Text logo",
    "content",
    '<div style="font-weight:800;font-size:28px;color:#215d4c;padding:20px">YOUR BRAND</div>',
  ],
  [
    "divider",
    "Đường phân cách",
    "Divider",
    "layout",
    '<hr style="border:0;border-top:1px solid #bfcfc5;margin:24px 0"/>',
  ],
  [
    "spacer",
    "Khoảng trống",
    "Spacer",
    "layout",
    '<div style="height:60px;width:100%"></div>',
  ],
  [
    "courses",
    "Danh sách khóa học",
    "Course list",
    "content",
    '<section id="courses"><h2>Khóa học / Courses</h2></section>',
  ],
  [
    "form",
    "Biểu mẫu",
    "Form",
    "interactive",
    '<form data-event="submit" data-action="message" data-message="Cảm ơn / Thank you"><label>Name <input name="name" placeholder="Name"/></label><label>Email <input name="email" type="email" placeholder="Email"/></label><button type="submit">Send</button></form>',
  ],
  [
    "faq",
    "Hỏi đáp",
    "FAQ",
    "interactive",
    '<details style="padding:20px"><summary>Câu hỏi / Question</summary><p>Câu trả lời / Answer</p></details>',
  ],
  [
    "testimonial",
    "Đánh giá",
    "Testimonial",
    "content",
    '<blockquote style="padding:24px;border-left:4px solid #215d4c"><p>Trải nghiệm tuyệt vời / A great learning experience.</p><small>— Learner</small></blockquote>',
  ],
  [
    "social",
    "Liên kết",
    "Links",
    "interactive",
    '<nav style="display:flex;gap:20px;padding:20px"><a href="https://www.youtube.com" target="_blank">YouTube</a><a href="https://www.facebook.com" target="_blank">Facebook</a></nav>',
  ],
];

const sectionStyle =
  "padding:64px 7%;font-family:Arial,sans-serif;color:#203c34";
const cardStyle =
  "padding:28px;border:1px solid #dce6df;border-radius:16px;background:white";
const sectionSamples: typeof samples = [
  [
    "hero-split",
    "Hero hai cột",
    "Split hero",
    "sections",
    `<section style="${sectionStyle};background:#eef4ef"><div class="yd-columns"><div><small style="letter-spacing:2px;color:#23776d">YOUR ACADEMY</small><h1 style="font-size:48px;line-height:1.1;margin:20px 0">Học hôm nay.<br/>Tạo ngày mai.</h1><p>Không gian đào tạo mang thương hiệu của bạn.</p><a class="yd-button" href="#courses">Khám phá khóa học →</a></div><div style="background:#dce9df;border-radius:28px;display:grid;place-items:center;min-height:300px"><div style="padding:32px;background:white;border-radius:18px;box-shadow:0 18px 50px #203c3415"><h2>Learn. Build. Grow.</h2><p>Mỗi ngày một bước tiến mới.</p></div></div></div></section>`,
  ],
  [
    "hero-center",
    "Hero tập trung",
    "Centered hero",
    "sections",
    `<section style="${sectionStyle};background:#f6f1e8;text-align:center"><small>START YOUR NEXT CHAPTER</small><h1 style="font-size:56px;max-width:850px;margin:24px auto">Không gian cho tri thức của bạn.</h1><p>Học sâu hơn, thực hành nhiều hơn, tiến xa hơn.</p><a class="yd-button" href="#courses">Bắt đầu học →</a></section>`,
  ],
  [
    "features",
    "Lưới lợi ích",
    "Feature grid",
    "sections",
    `<section style="${sectionStyle}"><h2>Học tập có định hướng.</h2><div class="yd-feature-grid">${["Lộ trình rõ ràng", "Thực hành thực tế", "Đồng hành mỗi ngày"].map((x, i) => `<article style="${cardStyle}"><small style="color:#23776d">0${i + 1}</small><h3>${x}</h3><p>Thêm mô tả ngắn về giá trị bạn mang tới cho học viên.</p></article>`).join("")}</div></section>`,
  ],
  [
    "stats",
    "Dải số liệu",
    "Statistics strip",
    "sections",
    `<section style="${sectionStyle};background:#eef4ef"><div class="yd-feature-grid">${[
      ["32", "Khóa học"],
      ["128", "Bài học"],
      ["8", "Lộ trình"],
    ]
      .map(
        ([a, b]) =>
          `<div style="text-align:center"><strong style="font-size:48px;color:var(--accent,#23776d)">${a}</strong><p>${b}</p></div>`,
      )
      .join("")}</div></section>`,
  ],
  [
    "cta-banner",
    "Kêu gọi hành động",
    "Call to action",
    "sections",
    `<section style="${sectionStyle}"><div style="padding:48px;border-radius:22px;background:var(--accent,#23776d);color:white"><h2>Bắt đầu hành trình của bạn.</h2><p>Chọn khóa học phù hợp và thực hành ngay hôm nay.</p><a class="yd-button" style="background:white;color:#203c34" href="#courses">Khám phá chương trình →</a></div></section>`,
  ],
  [
    "pricing",
    "Bảng chương trình",
    "Program comparison",
    "sections",
    `<section style="${sectionStyle}"><h2>Chọn cách học phù hợp.</h2><div class="yd-feature-grid">${["Nền tảng", "Thực hành", "Chuyên sâu"].map((x, i) => `<article style="${cardStyle};${i === 1 ? "border:2px solid #23776d;background:#eef4ef" : ""}"><small>LEARNING PLAN</small><h3>${x}</h3><p>Giới thiệu nội dung và hình thức học.</p><ul><li>Bài học có cấu trúc</li><li>Bài tập thực hành</li><li>Học theo tiến độ riêng</li></ul><a class="yd-button" href="#courses">Xem khóa học</a></article>`).join("")}</div></section>`,
  ],
  [
    "team",
    "Đội ngũ giảng viên",
    "Teaching team",
    "sections",
    `<section style="${sectionStyle}"><h2>Học cùng người có kinh nghiệm.</h2><div class="yd-feature-grid">${["Giảng viên 01", "Giảng viên 02", "Giảng viên 03"].map((x) => `<article style="${cardStyle}"><div style="height:150px;border-radius:12px;background:#e8eee8;display:grid;place-items:center;font-size:38px;color:#23776d">✦</div><h3>${x}</h3><p>Chuyên môn · Kinh nghiệm · Phương pháp dạy</p></article>`).join("")}</div></section>`,
  ],
  [
    "gallery",
    "Thư viện hình ảnh",
    "Image gallery",
    "sections",
    `<section style="${sectionStyle}"><h2>Khoảnh khắc học tập.</h2><div class="yd-feature-grid">${[1, 2, 3].map(() => '<img style="width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px" src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600" alt="Learning together"/>').join("")}</div></section>`,
  ],
];
samples.push(...sectionSamples);
for (const [id, vi, en, category, html] of samples)
  registerGadget({
    packageId: "yiedu." + id,
    version: "1.0.0",
    kind: "page-gadget",
    label: { vi, en },
    category,
    content: html,
    license: "free",
    capabilities: ["page:render", "events:declarative"],
  });
export function gadgetCatalog() {
  return gadgets.map(({ content, ...manifest }) => manifest);
}
export function installGadgets(editor: Editor, locale: "vi" | "en") {
  if (!booted.has(editor)) for (const g of gadgets) g.setup?.(editor);
  for (const g of gadgets)
    editor.Blocks.add(g.packageId, {
      label: g.label[locale],
      category: g.category,
      content: g.content.replace(
        /^<([a-z0-9-]+)/,
        `<$1 data-gadget="${g.packageId}"`,
      ),
    });
  if (booted.has(editor)) return;
  booted.add(editor);
  editor.on("component:add", (c: any) => {
    c.set({ resizable: true });
    const names = new Set(
      (c.get("traits") || []).map((x: any) => x.name || x.get?.("name")),
    );
    for (const trait of [
      { name: "title", label: "Title" },
      { name: "alt", label: "Alt text" },
      { name: "href", label: "Link" },
      { name: "src", label: "Media URL" },
    ])
      if (!names.has(trait.name)) c.addTrait(trait);
  });
}
