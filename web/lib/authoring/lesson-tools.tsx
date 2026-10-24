"use client";
import { Node, mergeAttributes, AnyExtension, Editor } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Mathematics from "@tiptap/extension-mathematics";
import { useState } from "react";
export type LessonTool = {
  packageId: string;
  version: string;
  label: { vi: string; en: string };
  license: "free" | "commercial";
  capabilities: string[];
  extension?: AnyExtension;
  insert: (editor: Editor) => void;
};
const tools: LessonTool[] = [];
export function registerLessonTool(tool: LessonTool) {
  if (tools.some((x) => x.packageId === tool.packageId))
    throw new Error("Duplicate lesson tool");
  tools.push(tool);
}
function SimulationView({ node, updateAttributes, editor }: any) {
  const [a, setA] = useState(node.attrs.amplitude || 1),
    [f, setF] = useState(node.attrs.frequency || 1);
  const points = Array.from(
    { length: 240 },
    (_, x) => `${x * 2},${80 - Math.sin((x / 24) * f) * a * 8}`,
  ).join(" ");
  return (
    <NodeViewWrapper className="simulation-node" contentEditable={false}>
      <strong>∿ Sine wave / Sóng sin</strong>
      <svg viewBox="0 0 480 160" aria-label="Interactive sine simulation">
        <path d="M0 80H480" stroke="#ccd" />
        <polyline
          points={points}
          fill="none"
          stroke="#215d4c"
          strokeWidth="3"
        />
      </svg>
      <label>
        Amplitude / Biên độ
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={a}
          onChange={(e) => {
            setA(+e.target.value);
            if (editor.isEditable)
              updateAttributes({ amplitude: +e.target.value });
          }}
        />
      </label>
      <label>
        Frequency / Tần số
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={f}
          onChange={(e) => {
            setF(+e.target.value);
            if (editor.isEditable)
              updateAttributes({ frequency: +e.target.value });
          }}
        />
      </label>
    </NodeViewWrapper>
  );
}
const Simulation = Node.create({
  name: "simulation",
  group: "block",
  atom: true,
  addAttributes() {
    return { amplitude: { default: 1 }, frequency: { default: 1 } };
  },
  parseHTML() {
    return [{ tag: 'div[data-tool="simulation"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-tool": "simulation" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(SimulationView);
  },
});
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "inline*",
  parseHTML() {
    return [{ tag: 'aside[data-tool="callout"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        "data-tool": "callout",
        class: "lesson-callout",
      }),
      0,
    ];
  },
});
const definitions: [
  string,
  string,
  string,
  (e: Editor) => void,
  AnyExtension?,
][] = [
  [
    "table",
    "Bảng",
    "Table",
    (e) =>
      e
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  ],
  [
    "math",
    "Công thức toán",
    "Math formula",
    (e) => {
      const node = (e.state.selection as any).node;
      const latex = prompt("LaTeX", node?.attrs?.latex || "E=mc^2");
      if (latex && ["inlineMath", "blockMath"].includes(node?.type.name)) {
        e.commands.updateAttributes(node.type.name, { latex });
        return;
      }
      if (latex)
        e.chain()
          .focus()
          .insertContent([
            { type: "blockMath", attrs: { latex } },
            { type: "paragraph" },
          ])
          .run();
    },
  ],
  [
    "simulation",
    "Mô phỏng",
    "Simulation",
    (e) => {
      e.chain()
        .focus()
        .insertContent([
          { type: "simulation", attrs: { amplitude: 1, frequency: 1 } },
          { type: "paragraph" },
        ])
        .run();
    },
    Simulation,
  ],
  [
    "callout",
    "Ghi chú",
    "Callout",
    (e) => {
      e.chain()
        .focus()
        .insertContent({
          type: "callout",
          content: [{ type: "text", text: "Important / Lưu ý" }],
        })
        .run();
    },
    Callout,
  ],
  [
    "image",
    "Hình ảnh",
    "Image",
    (e) => {
      const src = prompt("HTTPS image URL");
      if (src?.startsWith("https://"))
        e.chain().focus().setImage({ src, alt: "Lesson image" }).run();
    },
  ],
  [
    "video",
    "YouTube",
    "YouTube",
    (e) => {
      const src = prompt("YouTube URL");
      if (src) e.commands.setYoutubeVideo({ src });
    },
  ],
  [
    "tasks",
    "Checklist",
    "Checklist",
    (e) => {
      e.chain().focus().toggleTaskList().run();
    },
  ],
  [
    "code",
    "Mã nguồn",
    "Code block",
    (e) => {
      e.chain().focus().toggleCodeBlock().run();
    },
  ],
];
for (const [id, vi, en, insert, extension] of definitions)
  registerLessonTool({
    packageId: "yiedu.lesson-" + id,
    version: "1.0.0",
    label: { vi, en },
    license: "free",
    capabilities: ["lesson:render"],
    insert,
    extension,
  });
export function lessonTools() {
  return tools;
}
export function lessonExtensions() {
  return [
    StarterKit,
    TableKit,
    Image.configure({ allowBase64: false }),
    Youtube.configure({ nocookie: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Mathematics.configure({
      katexOptions: { throwOnError: false, trust: false, maxExpand: 500 },
    }),
    ...tools.flatMap((t) => (t.extension ? [t.extension] : [])),
  ];
}
