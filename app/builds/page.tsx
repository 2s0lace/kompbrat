import type { Metadata } from "next";

import { BuildListing } from "@/components/builds/build-listing";
import { PageShell } from "@/components/layout/page-shell";
import { allBuilds } from "@/lib/builds/data";

export const metadata: Metadata = {
  title: "Handpicked buildy",
  description: "Gotowe, handpicked segmenty buildów KOMPBRAT pod pracę i przyszłe rozszerzenie o gaming.",
};

export default function BuildsPage() {
  return (
    <PageShell
      title="Handpicked buildy"
      description="Gotowe segmenty zestawów KOMPBRAT opisane w data-driven strukturze. To nie są przypadkowe konfiguracje, tylko uporządkowane punkty startowe do pracy i kolejnych kategorii."
      eyebrow="Buildy KOMPBRAT"
    >
      <BuildListing builds={allBuilds} />
    </PageShell>
  );
}
