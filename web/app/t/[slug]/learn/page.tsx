import LearnScreen from "@/components/learn-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <LearnScreen slug={(await params).slug} />;
}
