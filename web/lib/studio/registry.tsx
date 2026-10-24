"use client";
import type { ComponentType } from "react";
import SimulationPlayer from "@/components/studio/simulation-player";
import PresentationPlayer from "@/components/studio/presentation-player";
import type { ProjectKind } from "./types";
export type StudioTool = {
  id: ProjectKind;
  packageId: string;
  version: string;
  label: { vi: string; en: string };
  description: { vi: string; en: string };
  Player: ComponentType<any>;
  capabilities: string[];
};
const registry = new Map<string, StudioTool>();
export function registerStudioTool(tool: StudioTool) {
  if (registry.has(tool.id)) throw new Error("Duplicate studio tool");
  registry.set(tool.id, tool);
}
registerStudioTool({
  id: "slides",
  packageId: "yiedu.studio-slides",
  version: "1.0.0",
  label: { vi: "Slide bài giảng", en: "Lesson slides" },
  description: {
    vi: "Biên soạn từng trang, ghi chú thuyết trình, trình chiếu và in PDF.",
    en: "Compose slides, presenter notes, present and print to PDF.",
  },
  Player: PresentationPlayer,
  capabilities: ["slides:edit", "slides:present", "slides:print"],
});
registerStudioTool({
  id: "video",
  packageId: "yiedu.studio-video",
  version: "1.0.0",
  label: { vi: "Video bài giảng", en: "Lesson video" },
  description: {
    vi: "Kịch bản theo cảnh, thời lượng, lời giảng; xuất video từ trình duyệt.",
    en: "Scene scripts, duration, narration and browser video export.",
  },
  Player: ({ data }: any) => <PresentationPlayer data={data} video />,
  capabilities: ["video:storyboard", "video:export"],
});
registerStudioTool({
  id: "simulation",
  packageId: "yiedu.studio-simulation",
  version: "1.0.0",
  label: { vi: "Mô phỏng tương tác", en: "Interactive simulation" },
  description: {
    vi: "Robot hai bánh, PID, thuật toán và hiệu năng phần mềm.",
    en: "Differential drive, PID, algorithms and software scaling.",
  },
  Player: SimulationPlayer,
  capabilities: ["simulation:configure", "simulation:interact"],
});
export const studioTools = () => Array.from(registry.values());
export const studioTool = (kind: string) => registry.get(kind);
