import { notFound } from "next/navigation";
import { publicApi } from "@/lib/api";
import SiteView from "@/components/site-view";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await publicApi("/sites/" + encodeURIComponent(slug));
  return {
    title: data?.tenant.name || "Không tìm thấy hệ thống",
    description:
      "Khám phá khóa học và lộ trình học tập tại " +
      (data?.tenant.name || "YiEdu"),
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const data = await publicApi(
    "/sites/" + encodeURIComponent((await params).slug),
  );
  if (!data) notFound();
  return <SiteView data={data} />;
}
