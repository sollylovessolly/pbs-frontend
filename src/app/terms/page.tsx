import PolicyPage from "@/component/legal/PolicyPage";
export const metadata = {
  title: "Terms of Order | PolaroidsBySolly",
  description:
    "Ordering, payment, delivery and cancellation terms for your personalised keepsakes.",
};
export default function TermsPage() {
  return <PolicyPage policy="terms" />;
}
