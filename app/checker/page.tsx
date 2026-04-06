import type { Metadata } from "next";

import { CheckerWorkspace } from "@/components/checker/checker-workspace";
import { checkerCopy } from "@/content/copy/checker";

export const metadata: Metadata = {
  title: "Sprawdź, czy ta oferta PC ma sens",
  description: "Wklej ofertę z OLX lub Allegro i szybko sprawdź, czy warto brać, negocjować czy odpuścić.",
};

export default function CheckerPage() {
  return (
    <div className="container-shell py-10 sm:py-14 lg:py-16">
      <section className="mx-auto max-w-5xl space-y-8 text-center">
        <div className="space-y-4">
          <span className="inline-flex rounded-full border border-border/70 bg-card/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-primary shadow-lift">
            KOMPBRAT Checker
          </span>
          <div className="space-y-4">
            <h1 className="font-serif text-4xl tracking-tight text-secondary sm:text-5xl lg:text-6xl">
              {checkerCopy.title}
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-8 text-muted-foreground">
              {checkerCopy.description}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {checkerCopy.pills.map((pill) => (
            <span
              key={pill}
              className="inline-flex rounded-full border border-border/70 bg-card/90 px-4 py-2 text-sm font-medium text-secondary shadow-lift"
            >
              {pill}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-10 sm:mt-12">
        <CheckerWorkspace />
      </div>
    </div>
  );
}
