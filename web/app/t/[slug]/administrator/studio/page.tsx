import StudioScreen from "@/components/studio/studio-screen";
export const dynamic = "force-dynamic";
export const metadata = { title: { absolute: "Content Studio" } };
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <StudioScreen slug={(await params).slug} />;
}
