import Hero from "@/components/sections/Hero";
import Services from "@/components/sections/Services";
import StatsBar from "@/components/sections/StatsBar";
import About from "@/components/sections/About";
import Vacancies from "@/components/sections/Vacancies";
import CtaBand from "@/components/sections/CtaBand";
import Process from "@/components/sections/Process";
import WhyUs from "@/components/sections/WhyUs";
import Courses from "@/components/sections/Courses";
import FAQ from "@/components/sections/FAQ";
import Blog from "@/components/sections/Blog";
import Testimonials from "@/components/sections/Testimonials";
import CtaFinal from "@/components/sections/CtaFinal";
import Newsletter from "@/components/sections/Newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <Services />
      <StatsBar />
      <About />
      <Vacancies />
      <CtaBand />
      <Process />
      <WhyUs />
      <Courses />
      <FAQ />
      <Blog />
      <Testimonials />
      <CtaFinal />
      <Newsletter />
    </>
  );
}
