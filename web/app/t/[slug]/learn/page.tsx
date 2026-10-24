import { publicApi } from "@/lib/api";
import LearnScreen from "@/components/learn-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <LearnScreen slug={(await params).slug} />;
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
