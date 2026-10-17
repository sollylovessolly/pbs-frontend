import AboutUs from "@/component/home/AboutUs";
import BestSellers from "@/component/home/BestSellers";
import FaqPreview from "@/component/home/FaqPreview";
import Gallery from "@/component/home/Gallery";
import PolaroidStation from "@/component/home/PolaroidStation";
import Hero from "@/component/home/Hero";
import HowItWorks from "@/component/home/HowItWorks";
import Testimonials from "@/component/home/Testimonials";
import TornDivider from "@/component/ui/TornDivider";

const HomePage = () => {
  return (
    <main>
      <Hero />

      <TornDivider color="cream" />

      <BestSellers />

      <HowItWorks />

      <PolaroidStation />

      <AboutUs />

      <Testimonials />

      <Gallery />

      <FaqPreview />

      <TornDivider color="burgundy" />
    </main>
  );
};

export default HomePage;
