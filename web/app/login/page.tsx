import AuthScreen from "@/components/auth-screen";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; site?: string }>;
}) {
  const q = await searchParams;
  return <AuthScreen register={false} template={q.template} site={q.site} />;
}
