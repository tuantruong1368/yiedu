"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import { lessonExtensions } from "@/lib/authoring/lesson-tools";
import { useI18n } from "../locale-provider";
import { useMemo } from "react";
import "katex/dist/katex.min.css";
export default function LessonView({
  lesson,
  hideHeading = false,
}: {
  lesson: any;
  hideHeading?: boolean;
}) {
  const { locale } = useI18n();
  const translated = lesson.translations?.[locale];
  const source = translated?.document || lesson.document;
  const doc = useMemo(() => {
    const first = source?.content?.[0],
      title = translated?.title || lesson.title;
    if (
      hideHeading &&
      first?.type === "heading" &&
      first.content?.map((n: any) => n.text || "").join("") === title
    )
      return { ...source, content: source.content.slice(1) };
    return source;
  }, [source, hideHeading, translated?.title, lesson.title]);
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
