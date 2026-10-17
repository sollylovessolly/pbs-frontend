import AboutUs from "@/component/home/AboutUs";
export const metadata = { title: "Our story | PolaroidsBySolly" };
export default function AboutPage() {
  return (
    <main>
      <AboutUs showStoryLink={false} />
    </main>
  );
}
