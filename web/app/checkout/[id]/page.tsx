import CheckoutScreen from "@/components/business/checkout-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <CheckoutScreen id={(await params).id} />;
}
