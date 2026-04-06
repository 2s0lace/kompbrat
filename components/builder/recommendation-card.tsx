import type { BuilderResponse } from "@/types/ai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecommendationCardProps = {
  response: BuilderResponse;
};

export function RecommendationCard({ response }: RecommendationCardProps) {
  const formatMode = (mode?: "new" | "used" | "mixed" | null) => {
    if (mode === "used") {
      return "Used";
    }

    if (mode === "mixed") {
      return "Mixed";
    }

    if (mode === "new") {
      return "New";
    }

    return "Brak";
  };

  const modeLabel =
    response.recommendationMode === "used"
      ? "Główna rekomendacja: używane"
      : response.recommendationMode === "mixed"
        ? "Główna rekomendacja: mieszane"
        : "Główna rekomendacja: nowe";

  const statusLabel =
    response.feasibleInSelectedMode === false
      ? "Nie spina się sensownie"
      : response.actualModeUsed && response.selectedMode && response.actualModeUsed !== response.selectedMode
        ? "Zmieniono na lepszy fallback"
        : "Tryb spełniony";

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          {response.recommendationMode ? (
            <span className="inline-flex rounded-full border border-border/80 bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {modeLabel}
            </span>
          ) : null}
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Proponowany zestaw</p>
          <CardTitle>{response.buildName}</CardTitle>
          <p className="text-sm leading-7 text-muted-foreground">{response.summary}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {response.selectedMode ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-border/80 bg-card/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wybrany tryb</p>
              <p className="mt-3 text-sm font-semibold text-secondary">{formatMode(response.selectedMode)}</p>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-card/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
              <p className="mt-3 text-sm font-semibold text-secondary">{statusLabel}</p>
            </div>
            <div className="rounded-[24px] border border-border/80 bg-card/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sugerowany tryb</p>
              <p className="mt-3 text-sm font-semibold text-secondary">
                {formatMode(response.feasibleInSelectedMode === false ? response.recommendedFallbackMode ?? response.actualModeUsed : response.actualModeUsed)}
              </p>
            </div>
          </div>
        ) : null}
        {response.modeMessage ? (
          <div className={`rounded-[24px] border p-4 ${response.feasibleInSelectedMode === false ? "border-warning/30 bg-warning/10" : "border-primary/15 bg-primary/5"}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Co stało się z wybranym trybem</p>
            <p className="mt-3 text-sm leading-7 text-secondary">{response.modeMessage}</p>
            {response.warningMessage ? <p className="mt-3 text-sm leading-7 text-muted-foreground">{response.warningMessage}</p> : null}
          </div>
        ) : null}
        {response.policyReason ? (
          <div className="rounded-[24px] border border-primary/15 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dlaczego wygrał ten tryb</p>
            <p className="mt-3 text-sm leading-7 text-secondary">{response.policyReason}</p>
          </div>
        ) : null}
        <div className="rounded-[24px] border border-border/80 bg-card/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Krótkie uzasadnienie</p>
          <ul className="mt-3 space-y-3">
            {response.notes.map((item) => (
              <li key={item} className="text-sm leading-7 text-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>
        {response.alternative ? (
          <div className="rounded-[24px] border border-tertiary/20 bg-tertiary/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Alternatywa, jeśli chcesz inną drogę</p>
            <p className="mt-3 text-sm font-semibold text-secondary">{response.alternative.buildName}</p>
            <p className="mt-2 text-sm leading-7 text-secondary">{response.alternative.summary}</p>
          </div>
        ) : null}
        <div className="rounded-[24px] bg-accent/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-foreground/70">Dla kogo ten zestaw</p>
          <p className="mt-3 text-sm leading-7 text-accent-foreground">{response.forWho}</p>
        </div>
        <div className="rounded-[24px] bg-warning/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-warning">Na co uważać</p>
          <ul className="mt-3 space-y-3">
            {response.warnings.map((item) => (
              <li key={item} className="rounded-[18px] border border-warning/20 bg-card/70 px-4 py-3 text-sm text-secondary">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
