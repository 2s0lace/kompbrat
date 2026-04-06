import type { StoredCheck } from "@/lib/storage/recent-checks";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getVerdictLabel(verdict: StoredCheck["result"]["verdict"]) {
  switch (verdict) {
    case "dobra okazja":
      return "Bierz";
    case "średnia":
      return "Negocjuj";
    case "podejrzanie dobra":
      return "Sprawdź dobrze";
    case "nieopłacalna":
    default:
      return "Odpuść";
  }
}

function getProfitabilityLabel(check: StoredCheck) {
  return check.result.profitabilityLabel ?? getVerdictLabel(check.result.verdict);
}

function getVerdictStyles(verdict: StoredCheck["result"]["verdict"]) {
  switch (verdict) {
    case "dobra okazja":
      return "bg-success/15 text-success";
    case "średnia":
      return "bg-warning/15 text-warning";
    case "podejrzanie dobra":
      return "bg-tertiary/15 text-secondary";
    case "nieopłacalna":
    default:
      return "bg-danger/15 text-danger";
  }
}

function getRiskLabel(score: number) {
  if (score >= 70) {
    return "Wysokie ryzyko";
  }

  if (score >= 45) {
    return "Średnie ryzyko";
  }

  return "Niskie ryzyko";
}

type RecentChecksProps = {
  checks: StoredCheck[];
  onSelectCheck: (check: StoredCheck) => void;
  onClear: () => void;
};

export function RecentChecks({ checks, onSelectCheck, onClear }: RecentChecksProps) {
  return (
    <Card className="rounded-[30px] border-border/70 bg-white/88 shadow-[0_16px_40px_rgba(67,53,40,0.07)]">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Historia</p>
          <CardTitle className="text-xl">Ostatnie sprawdzenia</CardTitle>
        </div>
        {checks.length > 0 ? (
          <Button type="button" variant="ghost" className="shrink-0" onClick={onClear}>
            Wyczyść
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 p-6 pt-0">
        {checks.length === 0 ? (
          <p className="text-sm leading-6 text-muted-foreground">
            Na razie pusto. Pierwszy sprawdzony zestaw pojawi się tutaj zaraz po analizie.
          </p>
        ) : (
          checks.map((check) => {
            const valueScore =
              typeof check.result.profitabilityScore === "number"
                ? check.result.profitabilityScore
                : typeof check.result.valueScore === "number"
                  ? check.result.valueScore
                  : check.result.score;
            const riskScore = typeof check.result.riskScore === "number" ? check.result.riskScore : 50;
            const verdictLabel = getProfitabilityLabel(check);
            const verdictStyles = getVerdictStyles(check.result.verdict);
            const riskLabel = check.result.riskLabel ? `${check.result.riskLabel} ryzyko` : getRiskLabel(riskScore);

            return (
              <button
                key={check.id}
                type="button"
                className="w-full rounded-[22px] border border-border/70 bg-background/85 p-4 text-left transition hover:-translate-y-0.5 hover:border-secondary/15 hover:bg-card"
                onClick={() => onSelectCheck(check)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${verdictStyles}`}>
                      {verdictLabel}
                    </span>
                    <p className="line-clamp-2 text-sm font-semibold leading-6 text-secondary">{check.title || "Oferta bez tytułu"}</p>
                  </div>
                  <span className="text-sm font-semibold text-secondary">{typeof check.price === "number" ? `${check.price} zł` : "Brak ceny"}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1">Opłacalność {valueScore}/100</span>
                  <span className="rounded-full bg-muted px-3 py-1">{riskLabel}</span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {new Date(check.createdAt).toLocaleString("pl-PL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
