import type { Metadata } from "next";

import TrackOrderPage from "@/component/tracking/TrackOrderPage";

export const metadata: Metadata = {
  title: "Track Order | PolaroidsBySolly",
  description:
    "Track your PolaroidsBySolly order using your phone number or tracking number.",
};

const TrackOrderRoute = () => {
  return <TrackOrderPage />;
};

export default TrackOrderRoute;
