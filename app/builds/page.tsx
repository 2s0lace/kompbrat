import type { Metadata } from "next";

import { BuildListing } from "@/components/builds/build-listing";
import { PageShell } from "@/components/layout/page-shell";
import { allBuilds } from "@/lib/builds/data";

export const metadata: Metadata = {
  title: "Handpicked buildy",
  description: "Gotowe zestawy KOMPBRAT pod gaming, pracę i używki. Sensowny punkt startowy bez zgadywania.",
};

export default function BuildsPage() {
  return (
    <PageShell
      title="Handpicked buildy"
      description="Pięć przykładowych zestawów KOMPBRAT z lokalnych danych. Możesz je filtrować po kategorii i traktować jako gotowe punkty startowe."
      eyebrow="Buildy KOMPBRAT"
    >
      <BuildListing builds={allBuilds} />
    </PageShell>
  );
}
