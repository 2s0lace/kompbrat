import type { Build } from "@/types/build";

import { BuildCard } from "@/components/builds/build-card";

export function BuildGrid({ builds }: { builds: Build[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {builds.map((build) => (
        <BuildCard key={build.id} build={build} />
      ))}
    </div>
  );
}
