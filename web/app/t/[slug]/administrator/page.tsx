import AdminScreen from "@/components/admin-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <AdminScreen slug={(await params).slug} />;
}
