import Reviews from "@/component/reviews/Reviews";
export const metadata = {
  title: "Customer reviews | PolaroidsBySolly",
  description:
    "Read customer experiences and share your PolaroidsBySolly review and photos.",
};
export default function ReviewsPage() {
  return (
    <main>
      <Reviews />
    </main>
  );
}
