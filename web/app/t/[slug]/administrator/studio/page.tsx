import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  redirect(
    `/t/${encodeURIComponent((await params).slug)}/administrator?tab=studio`,
  );
}
