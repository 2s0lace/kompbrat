import type { Metadata } from "next";

import { CtaBanner } from "@/components/home/cta-banner";
import { DealCheckerSpotlight } from "@/components/home/deal-checker-spotlight";
import { FeaturedBuilds } from "@/components/home/featured-builds";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";

export const metadata: Metadata = {
  title: "Dobierz komputer albo sprawdź ofertę",
  description:
    "KOMPBRAT to prosty builder PC, checker ofert z OLX i Allegro oraz handpicked buildy pod sensowne decyzje zakupowe.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedBuilds />
      <HowItWorks />
      <DealCheckerSpotlight />
      <CtaBanner />
    </>
  );
}
