export type ProjectKind = "slides" | "video" | "simulation";
export type Slide = {
  id: string;
  title: string;
  body: string;
  notes: string;
  duration: number;
};
export type Presentation = {
  version: "1.0";
  theme: string;
  slides: Slide[];
  source_url: string;
};
export type SimulationModel =
  "differential-drive" | "pid" | "sorting" | "scaling";
export type SimulationData = {
  version: "1.0";
  model: SimulationModel;
  parameters: Record<string, number>;
};
export type ProjectData = Presentation | SimulationData;
export type StudioAsset = {
  id: string;
  title: string;
  kind: ProjectKind;
  locale: "vi" | "en";
  data: ProjectData;
  revision: number;
  updated_at: string;
};
export const uid = () => crypto.randomUUID();
export const defaultSlide = (title = "Bài học mới / New lesson"): Slide => ({
  id: uid(),
  title,
  body: "Nêu vấn đề → Giải thích → Thực hành\nState a problem → Explain → Practice",
  notes: "",
  duration: 8,
});
export function defaultProject(kind: ProjectKind): ProjectData {
  return kind === "simulation"
    ? {
        version: "1.0",
        model: "differential-drive",
        parameters: { left: 0.6, right: 0.9, track: 0.5 },
      }
    : {
        version: "1.0",
        theme: "#215d4c",
        slides: [defaultSlide()],
        source_url: "",
      };
}
export const studioURL = (slug: string, kind?: string, id = "new") =>
  `/t/${slug}/administrator/studio${kind ? `/${kind}/${id}` : ""}`;
