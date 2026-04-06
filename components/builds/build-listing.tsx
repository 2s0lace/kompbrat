"use client";

import { useState } from "react";

import type { BuildCategory, Build } from "@/types/build";

import { BuildGrid } from "@/components/builds/build-grid";
import { Badge } from "@/components/ui/badge";
import { filterBuilds } from "@/lib/builds/filters";

const categories: Array<{ value: "all" | BuildCategory; label: string }> = [
  { value: "all", label: "wszystkie" },
  { value: "gaming", label: "gaming" },
  { value: "praca", label: "praca" },
  { value: "uzywany", label: "używany" },
  { value: "nowy", label: "nowy" },
];

export function BuildListing({ builds }: { builds: Build[] }) {
  const [activeCategory, setActiveCategory] = useState<"all" | BuildCategory>("all");
  const filteredBuilds =
    activeCategory === "all" ? builds : filterBuilds(builds, { category: activeCategory });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3" role="toolbar" aria-label="Filtry kategorii buildów">
        {categories.map((category) => {
          const isActive = category.value === activeCategory;

          return (
            <button key={category.value} type="button" aria-pressed={isActive} onClick={() => setActiveCategory(category.value)}>
              <Badge variant={isActive ? "secondary" : "outline"} className="px-4 py-2 text-sm capitalize">
                {category.label}
              </Badge>
            </button>
          );
        })}
      </div>

      {activeCategory === "nowy" ? (
        <p className="text-sm text-muted-foreground">
          Filtr `nowy` pokazujemy na podstawie buildów sklepowych. W tej paczce to głównie nowe zestawy gamingowe i do pracy.
        </p>
      ) : null}

      <BuildGrid
        builds={
          activeCategory === "nowy"
            ? builds.filter((build) => build.sourceType === "sklep")
            : filteredBuilds
        }
      />

      <p className="text-sm text-muted-foreground">
        Pokazujemy {activeCategory === "nowy" ? builds.filter((build) => build.sourceType === "sklep").length : filteredBuilds.length} buildów
        w aktualnym widoku.
      </p>
    </div>
  );
}
