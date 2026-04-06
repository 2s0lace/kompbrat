"use client";

import { useEffect, useRef, useState } from "react";

import type { CheckerResult as CheckerResultType } from "@/types/checker";
import type { StoredCheck } from "@/lib/storage/recent-checks";

import { CheckerForm } from "@/components/checker/checker-form";
import { CheckerResult } from "@/components/checker/checker-result";
import { RecentChecks } from "@/components/checker/recent-checks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { checkerCopy } from "@/content/copy/checker";
import { useRecentChecks } from "@/hooks/use-recent-checks";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";

const defaultState = {
  title: "Komputer RTX 3060 / Ryzen 5 5600 / 16 GB",
  price: "2399",
  url: "",
  description: "Ryzen 5 5600, RTX 3060, 16 GB RAM, 1 TB SSD. Komputer używany, brak gwarancji, bez zwrotu.",
};

const checkerLoadingSteps = [
  "Czytam opis i wyciągam podzespoły.",
  "Sprawdzam red flagi i opłacalność oferty.",
  "Porównuję wynik z sensowniejszą alternatywą.",
  "Składam werdykt Brata.",
];

export function CheckerWorkspace() {
  const [title, setTitle] = useState(defaultState.title);
  const [price, setPrice] = useState(defaultState.price);
  const [url, setUrl] = useState(defaultState.url);
  const [description, setDescription] = useState(defaultState.description);
  const [result, setResult] = useState<CheckerResultType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const { recentChecks, addRecentCheck, clearRecentChecks } = useRecentChecks();

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current < checkerLoadingSteps.length - 1 ? current + 1 : current));
    }, 1300);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && !result) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isLoading, result]);

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        url: url.trim(),
      };

      const request = await fetch("/api/deal-checker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!request.ok) {
        throw new Error("Nie udało się sprawdzić oferty. Spróbuj ponownie.");
      }

      const data = (await request.json()) as CheckerResultType;
      setResult(data);
      addRecentCheck({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        title: payload.title,
        description: payload.description,
        price: payload.price,
        url: payload.url || undefined,
        result: data,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Wystąpił nieznany błąd.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectCheck(check: StoredCheck) {
    setTitle(check.title ?? "");
    setPrice(typeof check.price === "number" ? String(check.price) : "");
    setUrl(check.url ?? "");
    setDescription(check.description);
    setResult(check.result);
    setError(null);
  }

  return (
    <div className="space-y-10 lg:space-y-12">
      {error ? <ErrorState message={error} /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.38fr_0.78fr]">
        <CheckerForm
          title={title}
          price={price}
          url={url}
          description={description}
          isPending={isLoading}
          onTitleChange={setTitle}
          onPriceChange={setPrice}
          onUrlChange={setUrl}
          onDescriptionChange={setDescription}
          onSubmit={handleSubmit}
        />

        <div className="space-y-6">
          <Card className="rounded-[30px] border-border/70 bg-white/88 shadow-[0_16px_40px_rgba(67,53,40,0.07)]">
            <CardHeader className="space-y-2 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Jak używać</p>
              <CardTitle className="text-xl">Co dostajesz po analizie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-0">
              <div className="rounded-[22px] border border-border/70 bg-background/80 p-4">
                <p className="text-sm font-semibold text-secondary">Jasny werdykt</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Od razu widzisz, czy brać ten zestaw, negocjować cenę czy odpuścić.</p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-background/80 p-4">
                <p className="text-sm font-semibold text-secondary">Wycena i ryzyko</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Pokazujemy, ile ten zestaw realnie broni się na rynku i gdzie są największe znaki zapytania.</p>
              </div>
              <div className="rounded-[22px] border border-border/70 bg-background/80 p-4">
                <p className="text-sm font-semibold text-secondary">Konkretne następne kroki</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Dostajesz listę rzeczy do sprawdzenia przed kupnem albo jasny sygnał, żeby nie tracić czasu.</p>
              </div>
            </CardContent>
          </Card>

          <RecentChecks checks={recentChecks} onSelectCheck={handleSelectCheck} onClear={clearRecentChecks} />
        </div>
      </section>

      <section ref={resultRef} className="space-y-5">
        <div className="max-w-2xl space-y-2">
          <h2 className="font-serif text-2xl tracking-tight text-secondary sm:text-3xl">Wynik analizy</h2>
          <p className="leading-7 text-muted-foreground">
            Najpierw najważniejsza decyzja, potem dopiero szczegóły. To ma pomóc podjąć szybką i sensowną decyzję zakupową.
          </p>
        </div>

        {isLoading ? (
          <LoadingState
            label="Sprawdzam opis, ryzyko i to, czy cena całego zestawu w ogóle się klei."
            steps={checkerLoadingSteps}
            activeStep={loadingStep}
          />
        ) : null}

        {!isLoading && !result ? (
          <EmptyState
            title="Tu pojawi się werdykt"
            description="Po analizie zobaczysz od razu najważniejszą decyzję, realną wartość zestawu, ryzyko i konkretne kroki, co zrobić dalej."
          />
        ) : null}

        {!isLoading && result ? <CheckerResult result={result} offerPrice={Number(price) || undefined} /> : null}
      </section>
    </div>
  );
}
