import type { Metadata } from "next";

import { CheckerHero } from "@/components/checker/checker-hero";
import { CheckerWorkspace } from "@/components/checker/checker-workspace";

export const metadata: Metadata = {
  title: "Sprawdź, czy ta oferta PC ma sens",
  description: "Wklej ofertę z OLX lub Allegro i szybko sprawdź, czy warto brać, negocjować czy odpuścić.",
};

export default function CheckerPage() {
  return (
    <>
      <CheckerHero />
      <div className="container-shell pb-16 sm:pb-20 lg:pb-24">
        <CheckerWorkspace />
      </div>
    </>
  );
}

