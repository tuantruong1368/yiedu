"use client";
import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { lessonExtensions, lessonTools } from "@/lib/authoring/lesson-tools";
import { useI18n } from "../locale-provider";
import { esc } from "@/lib/authoring/site";
import "katex/dist/katex.min.css";
export default function LessonEditor({
  initial,
  onChange,
  onReady,
}: {
  initial: any;
  onChange?: (docs: any) => void;
  onReady?: (editor: any) => void;
}) {
  const { t, locale } = useI18n(),
    [lang, setLang] = useState<"vi" | "en">("vi"),
    [docs, setDocs] = useState<any>({
      vi: {
        content: initial?.content || "",
        document: initial?.document || null,
      },
      en: {
        content: initial?.translations?.en?.content || "",
        document: initial?.translations?.en?.document || null,
        title: initial?.translations?.en?.title || "",
      },
    }),
    [info, setInfo] = useState("");
  const editor = useEditor(
    {
      extensions: lessonExtensions(),
      immediatelyRender: false,
      content:
        docs[lang].document || "<p>" + esc(docs[lang].content || "") + "</p>",
      editorProps: {
        attributes: {
          role: "textbox",
          "aria-label": t("Nội dung", "Content"),
          class: "lesson-tiptap",
        },
      },
      onUpdate: ({ editor }) =>
        setDocs((d: any) => ({
          ...d,
          [lang]: {
            ...d[lang],
            content: editor.getText(),
            document: editor.getJSON(),
          },
        })),
    },
    [lang],
  );
  useEffect(() => {
    onChange?.(docs);
  }, [docs]);
  useEffect(() => {
    if (editor) onReady?.(editor);
  }, [editor]);
  if (!editor)
    return <p>{t("Đang tải trình soạn thảo…", "Loading editor…")}</p>;
  return (
    <div className="lesson-editor">
      <div className="lesson-toolbar">
        <select
          aria-label="Lesson content language"
          value={lang}
          onChange={(e) => {
            const next = e.target.value as "vi" | "en";
            setLang(next);
          }}
        >
          <option value="vi">Tiếng Việt</option>
          <option value="en">English</option>
        </select>
        {[
          ["B", () => editor.chain().focus().toggleBold().run()],
          ["I", () => editor.chain().focus().toggleItalic().run()],
          ["U", () => editor.chain().focus().toggleUnderline().run()],
          [
            "H1",
            () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          ],
          [
            "H3",
            () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          ],
          ["❝", () => editor.chain().focus().toggleBlockquote().run()],
          ["―", () => editor.chain().focus().setHorizontalRule().run()],
          [
            "Clear",
            () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
          ],
          [
            "H2",
            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          ],
          ["• List", () => editor.chain().focus().toggleBulletList().run()],
          ["1. List", () => editor.chain().focus().toggleOrderedList().run()],
          [
            "Link",
            () => {
              const href = prompt("HTTPS or /path");
              if (href && /^(https:\/\/|\/(?!\/)|#)/.test(href))
                editor.chain().focus().setLink({ href }).run();
            },
          ],
          ["↶", () => editor.chain().focus().undo().run()],
          ["↷", () => editor.chain().focus().redo().run()],
        ].map(([label, action]) => (
          <button
            type="button"
            key={String(label)}
            onClick={action as () => void}
          >
            {String(label)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          + Row
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          + Column
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          − Row
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          − Column
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().mergeCells().run()}
        >
          Merge cells
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().splitCell().run()}
        >
          Split cell
        </button>
        {lessonTools().map((tool) => (
          <button
            type="button"
            key={tool.packageId}
            onClick={() => tool.insert(editor)}
          >
            {tool.label[locale]}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            setInfo(
              t(
                "Chưa cấu hình nhà cung cấp AI. Developer có thể đăng ký công cụ qua LessonTool API.",
                "No AI provider configured. Developers can register tools through the LessonTool API.",
              ),
            )
          }
        >
          AI
        </button>
      </div>
      {lang === "en" && (
        <label>
          English lesson title
          <input
            value={docs.en.title}
            onChange={(e) =>
              setDocs({ ...docs, en: { ...docs.en, title: e.target.value } })
            }
          />
        </label>
      )}
      <EditorContent key={lang} editor={editor} />
      {info && <p role="status">{info}</p>}
      <input type="hidden" name="content" value={docs.vi.content} />
      <input
        type="hidden"
        name="document"
        value={JSON.stringify(docs.vi.document)}
      />
      <input
        type="hidden"
        name="translations"
        value={JSON.stringify({ en: docs.en })}
      />
    </div>
  );
}
