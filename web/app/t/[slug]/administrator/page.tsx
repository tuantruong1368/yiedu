import { publicApi } from "@/lib/api";
import AdminScreen from "@/components/admin-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await publicApi("/sites/" + encodeURIComponent(slug));
  return <AdminScreen slug={slug} initialTenant={site?.tenant} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await publicApi("/sites/" + encodeURIComponent(slug));
  return {
    title: {
      absolute: data?.tenant.branding?.text || data?.tenant.name || slug,
    },
  };
}
