import Dashboard from "@/components/dashboard";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const q = await searchParams;
  return <Dashboard template={q.template} />;
}
