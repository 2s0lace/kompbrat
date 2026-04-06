import Link from "next/link";

import { PromptChip } from "@/components/shared/prompt-chip";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { homepageCopy } from "@/content/copy/homepage";
import { cn } from "@/lib/utils/cn";

export function Hero() {
  return (
    <section className="container-shell py-12 sm:py-16 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
        <div className="animate-fade-up space-y-7">
          <Badge variant="accent" className="px-4 py-2 text-[11px] uppercase tracking-[0.22em]">
            {homepageCopy.eyebrow}
          </Badge>
          <div className="space-y-5">
            <h1 className="max-w-4xl font-serif text-5xl leading-tight tracking-tight text-secondary sm:text-6xl">
              {homepageCopy.title}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{homepageCopy.description}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/builder" className={cn(buttonVariants({ variant: "default" }))}>
              Dobierz komputer
            </Link>
            <Link href="/checker" className={cn(buttonVariants({ variant: "secondary" }))}>
              Sprawdź ofertę
            </Link>
          </div>
          <div className="flex flex-wrap gap-3" aria-label="Przykładowe prompty">
            {homepageCopy.prompts.map((prompt) => (
              <PromptChip key={prompt} prompt={prompt} />
            ))}
          </div>
        </div>
        <Card className="animate-fade-up-delay overflow-hidden border-primary/15 bg-[linear-gradient(145deg,rgba(255,252,244,0.95)_0%,rgba(224,229,198,0.75)_100%)]">
          <CardContent className="p-6 sm:p-8">
            <div className="surface-panel border-none bg-card/75 p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">KOMPBRAT poleca</p>
                  <h2 className="mt-3 font-serif text-3xl text-secondary">Zestaw gamingowy do 3000 zł</h2>
                </div>
                <Badge variant="default">Dobry balans</Badge>
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                Rozsądny zestaw dla kogoś, kto chce wejść w granie bez przepalania budżetu i bez loterii w ofertach.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Builder</p>
                  <p className="mt-2 text-sm font-semibold text-secondary">Budżet, zastosowanie, priorytety</p>
                </div>
                <div className="surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Checker</p>
                  <p className="mt-2 text-sm font-semibold text-secondary">Cena, opis, szybkie red flagi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
