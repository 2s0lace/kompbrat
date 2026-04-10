import type { Metadata } from "next";

import { BuilderHero } from "@/components/builder/builder-hero";
import { BuilderWorkspace } from "@/components/builder/builder-workspace";

export const metadata: Metadata = {
  title: "Dobierz komputer z Bratem",
  description: "Opisz budżet, zastosowanie i preferencje, a KOMPBRAT podpowie sensowny zestaw i kompromisy.",
};

export default function BuilderPage() {
  return (
    <>
      <BuilderHero />
      <div className="container-shell pb-16 sm:pb-20 lg:pb-24">
        <BuilderWorkspace />
      </div>
    </>
  );
}
