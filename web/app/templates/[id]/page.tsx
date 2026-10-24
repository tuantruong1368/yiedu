import { publicApi } from "@/lib/api";
import { notFound } from "next/navigation";
import TemplatePreview from "@/components/template-preview";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ course?: string; page?: string }>;
}) {
  const { id } = await params,
    query = await searchParams;
  const data = await publicApi(`/catalog/templates/${encodeURIComponent(id)}`);
  if (!data) notFound();
  const course =
    data.courses.find((x: any) => x.id === query.course) || data.courses[0];
  const lessons = await publicApi(
    `/catalog/templates/${encodeURIComponent(id)}/courses/${encodeURIComponent(course.id)}`,
  );
  return (
    <TemplatePreview
      data={data}
      lessons={lessons || []}
      course={course}
      pageId={query.page || "home"}
    />
  );
}
