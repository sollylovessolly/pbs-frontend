import OrderDetailsPage from "@/component/tracking/OrderDetailsPage";

type OrderPageProps = {
  params: Promise<{
    orderNumber: string;
  }>;
};

const OrderPage = async ({
  params,
}: OrderPageProps) => {
  const { orderNumber } = await params;

  return (
    <OrderDetailsPage
      orderNumber={orderNumber}
    />
  );
};

export default OrderPage;