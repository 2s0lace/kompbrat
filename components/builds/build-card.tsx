import Link from "next/link";

import type { Build } from "@/types/build";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { getBuildCategoryLabel, getBuildSourceTypeLabel } from "@/lib/builds/utils";
import { formatPrice } from "@/lib/utils/format-price";

export function BuildCard({ build }: { build: Build }) {
  return (
    <article className="h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-transform duration-200 hover:-translate-y-1">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {build.badgeLabel ? <Badge variant="default">{build.badgeLabel}</Badge> : null}
            <Badge variant={build.category === "uzywany" ? "warning" : "outline"}>{getBuildCategoryLabel(build.category)}</Badge>
            <Badge variant="outline">{getBuildSourceTypeLabel(build.sourceType)}</Badge>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{build.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{build.useCase}</p>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          <div className="surface-muted flex items-center justify-between px-4 py-3">
            <span className="text-sm text-muted-foreground">Cena docelowa</span>
            <span className="text-sm font-semibold text-secondary">{formatPrice(build.price)}</span>
          </div>
          <div className="rounded-[24px] bg-secondary px-4 py-4 text-secondary-foreground">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground/70">Werdykt Brata</p>
            <p className="mt-2 text-base font-semibold">{build.shortVerdict}</p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href={`/builds/${build.slug}`} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Zobacz szczegóły
          </Link>
        </CardFooter>
      </Card>
    </article>
  );
}
