import Link from "next/link";

import { BuildCard } from "@/components/builds/build-card";
import { buttonVariants } from "@/components/ui/button";
import { getFeaturedBuilds } from "@/lib/builds/utils";
import { cn } from "@/lib/utils/cn";

export function FeaturedBuilds() {
  const builds = getFeaturedBuilds(4);

  return (
    <section className="container-shell animate-fade-up py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Handpicked builds</p>
          <h2 className="font-serif text-3xl tracking-tight text-secondary">Gotowe zestawy jako sensowny punkt startowy</h2>
          <p className="text-muted-foreground">
            Cztery przykładowe konfiguracje, które można potraktować jako realny punkt startowy do zakupu albo dalszych porównań.
          </p>
        </div>
        <Link href="/builds" className={cn(buttonVariants({ variant: "outline" }))}>
          Zobacz wszystkie buildy
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {builds.map((build) => (
          <BuildCard key={build.slug} build={build} />
        ))}
      </div>
    </section>
  );
}
