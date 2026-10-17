import { LuCheck, LuCircle } from "react-icons/lu";

import type { Order } from "@/types/order";

type OrderTimelineProps = {
  order: Order;
};

const timelineSteps = [
  "Order confirmed",
  "Payment confirmed",
  "Processing",
  "Ready for delivery",
  "Dispatched",
  "Delivered",
];

const getCurrentStep = (order: Order) => {
  if (order.paymentStatus !== "paid") {
    return 1;
  }

  const statusSteps: Record<
    Exclude<Order["orderStatus"], "cancelled">,
    number
  > = {
    processing: 2,
    ready: 3,
    dispatched: 4,
    delivered: 5,
  };

  if (order.orderStatus === "cancelled") {
    return -1;
  }

  return statusSteps[order.orderStatus];
};

const OrderTimeline = ({ order }: OrderTimelineProps) => {
  if (order.orderStatus === "cancelled") {
    return (
      <div className="rounded-[14px] border-2 border-burgundy bg-blush p-5">
        <p className="font-serif text-xl font-semibold text-burgundy">
          Order Cancelled
        </p>

        <p className="mt-2 text-sm leading-6 text-ink/65">
          This order is no longer being processed. Contact PolaroidsBySolly if
          you need more information.
        </p>
      </div>
    );
  }

  const currentStep = getCurrentStep(order);

  return (
    <ol className="space-y-0">
      {timelineSteps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === timelineSteps.length - 1;

        return (
          <li key={step} className="relative flex gap-4">
            {!isLast && (
              <span
                aria-hidden="true"
                className={[
                  "absolute left-[15px] top-8 h-[calc(100%-18px)] w-0.5",
                  isCompleted ? "bg-burgundy" : "bg-ink/15",
                ].join(" ")}
              />
            )}

            <span
              className={[
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                isCompleted
                  ? "border-ink bg-burgundy text-cream"
                  : isCurrent
                    ? "border-ink bg-beige text-ink shadow-[2px_2px_0_#2A211C]"
                    : "border-ink/30 bg-paper text-ink/30",
              ].join(" ")}
            >
              {isCompleted ? (
                <LuCheck className="h-4 w-4" />
              ) : (
                <LuCircle
                  className={[
                    "h-3 w-3",
                    isCurrent ? "fill-burgundy text-burgundy" : "",
                  ].join(" ")}
                />
              )}
            </span>

            <div className="min-h-16 pb-5">
              <p
                className={[
                  "pt-1 text-sm font-bold",
                  isCurrent
                    ? "text-burgundy"
                    : isCompleted
                      ? "text-ink"
                      : "text-ink/35",
                ].join(" ")}
              >
                {step}
              </p>

              {isCurrent && (
                <p className="mt-1 text-xs leading-5 text-ink/55">
                  Your order is currently at this stage.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default OrderTimeline;
