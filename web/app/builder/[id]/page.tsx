import Builder from "@/components/builder";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <Builder id={(await params).id} />;
}
