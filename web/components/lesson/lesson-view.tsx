"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { lessonExtensions } from "@/lib/authoring/lesson-tools";
import { useI18n } from "../locale-provider";
import "katex/dist/katex.min.css";
export default function LessonView({ lesson }: { lesson: any }) {
  const { locale } = useI18n();
  const translated = lesson.translations?.[locale];
  const doc = translated?.document || lesson.document;
  const editor = useEditor(
    {
      extensions: lessonExtensions(),
      editable: false,
      immediatelyRender: false,
      content: doc || {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: translated?.content || lesson.content || " ",
              },
            ],
          },
        ],
      },
    },
    [lesson.id, locale, doc],
  );
  return (
    <div className="lesson-document">
      <EditorContent editor={editor} />
    </div>
  );
}
