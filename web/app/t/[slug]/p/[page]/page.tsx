import { notFound } from "next/navigation";
import SiteView from "@/components/site-view";
import { publicApi } from "@/lib/api";
import { getLocale } from "@/lib/i18n/server";
type Props = { params: Promise<{ slug: string; page: string }> };
async function load(params: Props["params"]) {
  const p = await params;
  const data = await publicApi("/sites/" + encodeURIComponent(p.slug));
  const page = data?.tenant.published_page?.pages?.find(
    (x: any) => x.slug === p.page,
  );
  return { data, page, slug: p.page };
}
export async function generateMetadata({ params }: Props) {
  const { data, page } = await load(params),
    locale = await getLocale();
  return {
    title: {
      absolute:
        page?.title[locale] || data?.tenant.branding?.text || data?.tenant.name,
    },
  };
}
export default async function Page({ params }: Props) {
  const { data, page, slug } = await load(params);
  if (!data || !page) notFound();
  return <SiteView data={data} pageSlug={slug} />;
}
