import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const flags = ["Za tanio jak na specyfikację", "Niejasny opis gwarancji", "Frazy typu: bez zwrotu"];

export function DealCheckerSpotlight() {
  return (
    <section className="container-shell animate-fade-up-delay-2 py-10 sm:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <Badge variant="tertiary" className="px-4 py-2 text-[11px] uppercase tracking-[0.22em]">
            Deal checker
          </Badge>
          <div className="space-y-4">
            <h2 className="font-serif text-4xl tracking-tight text-secondary">Oferty z OLX i Allegro pod lupą, zanim wydasz pieniądze.</h2>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Wklejasz tytuł, opis i cenę. Checker daje szybki wynik, pokazuje ryzyka i pomaga oddzielić dobrą okazję od
              podejrzanej oferty.
            </p>
          </div>
          <Link href="/checker" className={cn(buttonVariants({ variant: "secondary" }))}>
            Przejdź do checkera
          </Link>
        </div>

        <Card className="overflow-hidden bg-[linear-gradient(145deg,rgba(255,252,244,0.95)_0%,rgba(234,224,218,0.85)_100%)]">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Szybki check oferty</CardTitle>
              <Badge variant="warning">Oferta średnia</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              &quot;Ryzen 5 5600, RTX 3060, brak gwarancji, bez zwrotu&quot;
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-warning/12 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">Na co uważać</p>
              <div className="mt-3 space-y-3">
                {flags.map((flag) => (
                  <div key={flag} className="rounded-[18px] border border-warning/20 bg-card/70 px-4 py-3 text-sm text-secondary">
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
