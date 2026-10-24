import { publicApi } from "@/lib/api";
import { notFound } from "next/navigation";
import StudioScreen from "@/components/studio/studio-screen";
export const dynamic = "force-dynamic";
export const metadata = { title: { absolute: "Content Studio" } };
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; kind: string; id: string }>;
}) {
  const { slug, kind, id } = await params;
  if (
    !["lesson", "slides", "video", "simulation"].includes(kind) ||
    !(id === "new" || /^[a-f0-9-]{36}$/.test(id))
  )
    notFound();
  const site = await publicApi("/sites/" + encodeURIComponent(slug));
  return (
    <StudioScreen
      slug={slug}
      kind={kind}
      projectId={id}
      initialTenant={site?.tenant}
    />
  );
}
