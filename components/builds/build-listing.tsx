"use client";

import { useState } from "react";

import type { Build, BuildCategory, BuildSourceType } from "@/types/build";

import { BuildGrid } from "@/components/builds/build-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { filterBuilds } from "@/lib/builds/filters";
import { getBuildPolicyHint } from "@/lib/builds/policy";
import { getBuildCategoryLabel, getBuildSourceTypeLabel } from "@/lib/builds/utils";
import { cn } from "@/lib/utils/cn";

type BuildListingProps = {
  builds: Build[];
};

const categoryOptions: Array<{ value: "all" | BuildCategory; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "work", label: "Praca" },
  { value: "gaming", label: "Gaming" },
];

const sourceTypeOptions: Array<{ value: "all" | BuildSourceType; label: string }> = [
  { value: "all", label: "Wszystkie" },
  { value: "new", label: "Nowy" },
  { value: "mixed", label: "Mixed" },
  { value: "used", label: "Używany" },
];

function FilterButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? "border-secondary bg-secondary text-secondary-foreground"
          : "border-border/80 bg-card/70 text-secondary hover:border-secondary/40 hover:bg-card",
      )}
    >
      {label}
    </button>
  );
}

export function BuildListing({ builds }: BuildListingProps) {
  const [activeCategory, setActiveCategory] = useState<"all" | BuildCategory>("all");
  const [activeSourceType, setActiveSourceType] = useState<"all" | BuildSourceType>("all");

  const filteredBuilds = filterBuilds(builds, {
    category: activeCategory === "all" ? undefined : activeCategory,
    sourceType: activeSourceType === "all" ? undefined : activeSourceType,
  });

  const policyHint = getBuildPolicyHint(activeCategory);

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-serif text-2xl tracking-tight text-secondary">Segmenty gotowych zestawów</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Handpicked buildy to uporządkowane segmenty przygotowane jako sensowny punkt startowy. Każdy zestaw jest opisany po ludzku,
                ma jasno rozpisaną specyfikację i da się go później łatwo edytować z jednego pliku danych.
              </p>
            </div>

            <Badge variant="outline" className="bg-card/80 px-4 py-2 text-sm">
              {filteredBuilds.length} buildy w widoku
            </Badge>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kategoria</p>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((option) => (
                  <FilterButton
                    key={option.value}
                    isActive={activeCategory === option.value}
                    label={option.value === "all" ? option.label : getBuildCategoryLabel(option.value)}
                    onClick={() => setActiveCategory(option.value)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Source type</p>
              <div className="flex flex-wrap gap-2">
                {sourceTypeOptions.map((option) => (
                  <FilterButton
                    key={option.value}
                    isActive={activeSourceType === option.value}
                    label={option.value === "all" ? option.label : getBuildSourceTypeLabel(option.value)}
                    onClick={() => setActiveSourceType(option.value)}
                  />
                ))}
              </div>
            </section>
          </div>

          {policyHint ? <p className="text-sm leading-7 text-muted-foreground">{policyHint}</p> : null}
        </CardContent>
      </Card>

      {filteredBuilds.length > 0 ? (
        <BuildGrid builds={filteredBuilds} />
      ) : (
        <EmptyState
          title="Brak buildów dla wybranych filtrów"
          description="Na ten moment wdrożone są tylko segmenty Praca. Struktura pod Gaming już jest gotowa, więc późniejsze dopisywanie kolejnych buildów pójdzie bez przebudowy komponentów."
        />
      )}
    </div>
  );
}
