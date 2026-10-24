import type { Editor } from "grapesjs";
export type GadgetDefinition = {
  packageId: string;
  version: string;
  kind: "page-gadget";
  label: { vi: string; en: string };
  category: "layout" | "content" | "media" | "interactive";
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
