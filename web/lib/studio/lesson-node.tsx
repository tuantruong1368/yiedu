"use client";
import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { studioTool } from "./registry";
import { useState } from "react";
import ProjectEditor from "@/components/studio/project-editor";
import { useI18n } from "@/components/locale-provider";
function StudioNodeView({ node, editor, deleteNode, updateAttributes }: any) {
  const [editing, setEditing] = useState(false);
  const { t } = useI18n();
  const tool = studioTool(node.attrs.kind);
  return (
    <NodeViewWrapper className="studio-lesson-node" contentEditable={false}>
      <header>
        <span>{node.attrs.title}</span>
        {editor.isEditable && (
          <div>
            <button type="button" onClick={() => setEditing(!editing)}>
              {editing ? t("Xong", "Done") : t("Sửa học liệu", "Edit media")}
            </button>
            <button type="button" onClick={deleteNode} aria-label="Remove tool">
              ×
            </button>
          </div>
        )}
      </header>
      {editing && editor.isEditable ? (
        <ProjectEditor
          kind={node.attrs.kind}
          data={node.attrs.payload}
          onChange={(payload) => updateAttributes({ payload })}
        />
      ) : tool ? (
        <tool.Player data={node.attrs.payload} />
      ) : (
        <p>Unsupported tool</p>
      )}
    </NodeViewWrapper>
  );
}
export const StudioNode = Node.create({
  name: "studioAsset",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      kind: { default: "slides" },
      title: { default: "" },
      payload: {
        default: null,
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute("data-project") || "null");
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) => ({
          "data-project": JSON.stringify(attrs.payload),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-studio-asset]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-studio-asset": "true" }),
      String(HTMLAttributes.title || "Learning tool"),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StudioNodeView);
  },
});
