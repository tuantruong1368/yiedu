import AuthScreen from "@/components/auth-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; site?: string; course?: string }>;
}) {
  const q = await searchParams;
  return (
    <AuthScreen
      register={true}
      template={q.template}
      site={q.site}
      course={q.course}
    />
  );
}
