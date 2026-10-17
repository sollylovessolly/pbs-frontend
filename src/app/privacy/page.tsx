import PolicyPage from "@/component/legal/PolicyPage";
export const metadata = {
  title: "Privacy Policy | PolaroidsBySolly",
  description:
    "How we use your photos and order details. Your photos will not be posted or used in marketing without your separate permission.",
};
export default function PrivacyPage() {
  return <PolicyPage policy="privacy" />;
}
