import Link from "next/link";

import type { Build } from "@/types/build";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBuildCategoryLabel,
  getBuildHref,
  getBuildSourceTypeBadgeVariant,
  getBuildSourceTypeLabel,
  getHighlightedSpecs,
} from "@/lib/builds/utils";
import { cn } from "@/lib/utils/cn";

type BuildCardProps = {
  build: Build;
};

export function BuildCard({ build }: BuildCardProps) {
  const highlightedSpecs = getHighlightedSpecs(build, 5);

  return (
    <article className="h-full">
      <Card className="flex h-full flex-col border-border/70">
        <CardHeader className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{getBuildCategoryLabel(build.category)}</Badge>
                <Badge variant={getBuildSourceTypeBadgeVariant(build.sourceType)}>{getBuildSourceTypeLabel(build.sourceType)}</Badge>
                {build.featured ? <Badge variant="default">Handpicked</Badge> : null}
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-[1.75rem]">{build.title}</CardTitle>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{build.shortDescription}</p>
              </div>
            </div>

            <div className="min-w-[160px] rounded-[24px] border border-border/80 bg-secondary px-5 py-4 text-secondary-foreground">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary-foreground/70">Segment cenowy</p>
              <p className="mt-2 text-xl font-semibold">{build.priceRange}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-6">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary/80">Najważniejsza specyfikacja</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlightedSpecs.map((spec) => (
                <div key={`${build.id}-${spec.label}`} className="rounded-[22px] border border-border/70 bg-card/70 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{spec.label}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-secondary">{spec.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary/80">Dla kogo</h3>
            <p className="text-sm leading-7 text-muted-foreground">{build.whoIsItFor}</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary/80">Dlaczego ten zestaw</h3>
            <ul className="space-y-2 text-sm leading-6 text-secondary">
              {build.whyThisBuild.map((reason) => (
                <li key={reason} className="rounded-[18px] bg-accent/60 px-4 py-3">
                  {reason}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-wrap gap-2">
            {build.tags.map((tag) => (
              <Badge key={`${build.id}-${tag}`} variant="outline" className="bg-card/80">
                {tag}
              </Badge>
            ))}
          </section>
        </CardContent>

        <CardFooter className="mt-auto">
          <Link href={getBuildHref(build)} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Zobacz szczegóły
          </Link>
        </CardFooter>
      </Card>
    </article>
  );
}
