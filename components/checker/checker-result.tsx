import type { CheckerResult as CheckerResultType, DetectedPartType } from "@/types/checker";

import { Card, CardContent } from "@/components/ui/card";

type CheckerResultProps = {
  result: CheckerResultType;
  offerPrice?: number;
};

const expectedParts: Array<{ type: DetectedPartType; label: string }> = [
  { type: "CPU", label: "CPU" },
  { type: "GPU", label: "GPU" },
  { type: "RAM", label: "RAM" },
  { type: "DYSK", label: "Dysk" },
  { type: "PŁYTA", label: "Płyta" },
  { type: "PSU", label: "PSU" },
];

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("pl-PL").format(Math.round(value))} zł`;
}

function deriveRiskLabel(score: number) {
  if (score >= 70) {
    return "Wysokie";
  }

  if (score >= 45) {
    return "Średnie";
  }

  return "Niskie";
}

function getProfitabilityLabel(result: CheckerResultType) {
  if (result.profitabilityLabel) {
    return result.profitabilityLabel;
  }

  switch (result.verdict) {
    case "dobra okazja":
      return "Bierz";
    case "średnia":
      return "Negocjuj";
    case "nieopłacalna":
      return "Odpuść";
    case "podejrzanie dobra":
      return "Bierz";
    default:
      return "Negocjuj";
  }
}

function getVerdictMeta(profitabilityLabel: ReturnType<typeof getProfitabilityLabel>) {
  switch (profitabilityLabel) {
    case "Bierz":
      return {
        action: "Bierz",
        label: "Warto brać",
        badgeClass: "bg-success/15 text-success ring-1 ring-success/20",
        panelClass: "border-success/20 bg-[linear-gradient(145deg,rgba(240,246,235,0.98)_0%,rgba(255,255,255,0.96)_100%)]",
      };
    case "Negocjuj":
      return {
        action: "Negocjuj",
        label: "Do negocjacji",
        badgeClass: "bg-warning/15 text-warning ring-1 ring-warning/20",
        panelClass: "border-warning/20 bg-[linear-gradient(145deg,rgba(251,246,232,0.98)_0%,rgba(255,255,255,0.96)_100%)]",
      };
    case "Raczej nie":
      return {
        action: "Średnia",
        label: "Słaby układ",
        badgeClass: "bg-tertiary/15 text-secondary ring-1 ring-tertiary/20",
        panelClass: "border-tertiary/20 bg-[linear-gradient(145deg,rgba(252,242,236,0.98)_0%,rgba(255,255,255,0.96)_100%)]",
      };
    default:
      return {
        action: "Odpuść",
        label: "Nie warto",
        badgeClass: "bg-danger/15 text-danger ring-1 ring-danger/20",
        panelClass: "border-danger/20 bg-[linear-gradient(145deg,rgba(249,239,236,0.98)_0%,rgba(255,255,255,0.96)_100%)]",
      };
  }
}

function getValueRange(result: CheckerResultType) {
  if (typeof result.estimatedValueMin === "number" && typeof result.estimatedValueMax === "number") {
    return {
      min: result.estimatedValueMin,
      max: result.estimatedValueMax,
    };
  }

  if (result.fairValueRange) {
    return result.fairValueRange;
  }

  const estimatedValue = result.fairValue ?? result.estimatedMarketValue;
  const confidence = result.estimatedMarketValueConfidence;

  if (typeof estimatedValue !== "number") {
    return null;
  }

  const margin =
    confidence === "high"
      ? Math.max(150, estimatedValue * 0.08)
      : confidence === "medium"
        ? Math.max(250, estimatedValue * 0.12)
        : Math.max(400, estimatedValue * 0.16);

  return {
    min: Math.max(0, Math.round(estimatedValue - margin)),
    max: Math.round(estimatedValue + margin),
  };
}

function getValueHeadline(result: CheckerResultType, offerPrice?: number) {
  const range = getValueRange(result);

  if (!range) {
    return {
      title: "Brak pewnej wyceny",
      subtitle: "Specyfikacja jest zbyt niepełna, żeby uczciwie policzyć sensowną cenę.",
    };
  }

  if (typeof offerPrice === "number" && offerPrice > range.max) {
    return {
      title: `Sensownie do: ${formatCurrency(range.max)}`,
      subtitle: `Realna wartość tego zestawu wygląda raczej na ${formatCurrency(range.min)}–${formatCurrency(range.max)}.`,
    };
  }

  return {
    title: `Realna wartość: ${formatCurrency(range.min)}–${formatCurrency(range.max)}`,
    subtitle: typeof offerPrice === "number" ? `Oferta stoi za ${formatCurrency(offerPrice)}.` : "Zakres jest orientacyjny i zależy od stanu sprzętu.",
  };
}

function getMainDecisionSentence(result: CheckerResultType, offerPrice?: number) {
  if (result.verdictSummary) {
    return result.verdictSummary;
  }

  const range = getValueRange(result);

  if (typeof offerPrice === "number" && range && offerPrice > range.max) {
    return `Za ${formatCurrency(offerPrice)} ten zestaw jest wyraźnie za drogi względem tego, co widać w specyfikacji.`;
  }

  if (typeof offerPrice === "number" && range && offerPrice < range.min && result.verdict === "podejrzanie dobra") {
    return `Na papierze ta oferta wygląda bardzo mocno, ale cena ${formatCurrency(offerPrice)} jest tak niska, że najpierw trzeba twardo sprawdzić sprzedawcę i sprzęt.`;
  }

  return result.decisionSummary?.shortVerdict ?? result.summary;
}

function humanizeValuationNote(note?: string) {
  if (!note) {
    return null;
  }

  if (note.includes("GPU floor")) {
    return "Wycena została podciągnięta do bezpiecznego minimum, bo surowy wynik nie kleił się z klasą wykrytego GPU.";
  }

  if (note.includes("whole-build GPU floor")) {
    return "Wycena została skorygowana do minimalnego poziomu, który jeszcze ma sens przy tej klasie karty.";
  }

  if (note.includes("Estimated value fell below the detected GPU value")) {
    return "Surowa wycena była zbyt niska względem samej karty, więc checker ją skorygował.";
  }

  return "Wycena została ostrożnie skorygowana, bo surowy wynik wyglądał niewiarygodnie względem wykrytych części.";
}

function getWhyVerdictPoints(result: CheckerResultType, offerPrice?: number) {
  if (result.insights) {
    return [
      ...result.insights.red_flags.map((item) => item.text),
      ...result.insights.minuses.map((item) => item.text),
      ...result.insights.positives.map((item) => item.text),
    ].slice(0, 5);
  }

  const summaryPoints = result.decisionSummary?.keyTakeaways ?? [];
  if (summaryPoints.length > 0) {
    return summaryPoints.slice(0, 5);
  }

  const points: string[] = [];
  const range = getValueRange(result);

  if (typeof offerPrice === "number" && range) {
    if (offerPrice > range.max) {
      points.push(`Cena ${formatCurrency(offerPrice)} wyraźnie wychodzi ponad sensowny zakres ${formatCurrency(range.min)}–${formatCurrency(range.max)}.`);
    } else if (offerPrice < range.min) {
      points.push(`Cena wygląda bardzo nisko względem zakresu ${formatCurrency(range.min)}–${formatCurrency(range.max)}, więc bardziej liczy się ryzyko niż sama opłacalność na papierze.`);
    } else {
      points.push(`Cena mieści się mniej więcej w tym, czego można oczekiwać po tej klasie zestawu.`);
    }
  }

  if (result.gpuValueCheck) {
    if (result.gpuValueCheck.gpu_position_for_price === "too_weak") {
      points.push(result.gpuValueCheck.explanation);
    } else if (result.gpuValueCheck.gpu_position_for_price === "strong" && result.verdict !== "dobra okazja") {
      points.push("Sama karta wygląda sensownie, ale to jeszcze nie wystarcza, żeby obronić cenę całego zestawu.");
    } else if (result.gpuValueCheck.gpu_position_for_price === "ok") {
      points.push("GPU samo w sobie się broni, ale liczy się cały zestaw, a nie tylko jedna część.");
    } else {
      points.push(result.gpuValueCheck.explanation);
    }
  }

  if (result.psuAssessment?.status === "too_weak") {
    points.push("Zasilacz wygląda zbyt słabo do tej konfiguracji, więc nawet przy dobrej cenie robi się niebezpiecznie.");
  } else if (result.psuAssessment?.warning) {
    points.push(result.psuAssessment.warning);
  }

  const uniqueFlags = Array.from(new Set(result.redFlags));
  for (const flag of uniqueFlags.slice(0, 2)) {
    points.push(flag);
  }

  const valuationNote = humanizeValuationNote(result.valuationNote);
  if (valuationNote) {
    points.push(valuationNote);
  }

  return Array.from(new Set(points)).slice(0, 5);
}

function getActionItems(result: CheckerResultType, offerPrice?: number) {
  if (result.nextSteps?.length) {
    return result.nextSteps.slice(0, 5);
  }

  if (result.decisionSummary?.nextSteps?.length) {
    return result.decisionSummary.nextSteps.slice(0, 4);
  }

  const actions: string[] = [];
  const range = getValueRange(result);

  if (typeof offerPrice === "number" && range && offerPrice > range.max) {
    actions.push(`Jeśli w ogóle chcesz to rozważać, negocjuj raczej do maksymalnie ${formatCurrency(range.max)}.`);
  }

  if (result.redFlags.some((flag) => flag.toLowerCase().includes("zasilacza"))) {
    actions.push("Poproś o dokładny model zasilacza i zdjęcie jego naklejki.");
  }

  if (result.redFlags.some((flag) => flag.toLowerCase().includes("dysk"))) {
    actions.push("Poproś o SMART dysku i screen z pojemnością oraz stanem nośnika.");
  }

  if (result.redFlags.some((flag) => flag.toLowerCase().includes("scam")) || result.riskScore >= 70) {
    actions.push("Celuj w odbiór osobisty i test na miejscu. Bez zaliczek i bez wiary na słowo.");
  }

  if (!result.detectedParts.some((part) => part.type === "PSU" && part.confidence !== "low")) {
    actions.push("Poproś o zdjęcie wnętrza obudowy i listę wszystkich części, nie tylko głównych haseł z opisu.");
  }

  if (actions.length === 0) {
    actions.push("Dopytaj o temperatury, kulturę pracy i historię sprzętu, zanim zamkniesz temat.");
  }

  return actions.slice(0, 4);
}

function getPartDisplay(result: CheckerResultType, offerPrice?: number) {
  const map = new Map(result.detectedParts.map((part) => [part.type, part]));

  return expectedParts.map(({ type, label }) => {
    const part = map.get(type);

    return {
      label,
      value: part ? part.name : "Nieznane",
      confidence: part?.confidence,
      known: Boolean(part),
    };
  }).concat(
    typeof offerPrice === "number"
      ? [
          {
            label: "Cena",
            value: formatCurrency(offerPrice),
            confidence: "high" as const,
            known: true,
          },
        ]
      : [],
  );
}

export function CheckerResult({ result, offerPrice }: CheckerResultProps) {
  const profitabilityLabel = getProfitabilityLabel(result);
  const verdictMeta = getVerdictMeta(profitabilityLabel);
  const valueHeadline = getValueHeadline(result, offerPrice);
  const mainDecisionSentence = getMainDecisionSentence(result, offerPrice);
  const riskLabel = result.riskLabel ?? deriveRiskLabel(result.riskScore ?? 50);
  const profitabilityScore = result.profitabilityScore ?? result.valueScore ?? result.score;
  const valueRange = getValueRange(result);
  const whyVerdictPoints = getWhyVerdictPoints(result, offerPrice);
  const actionItems = getActionItems(result, offerPrice);
  const parts = getPartDisplay(result, offerPrice);
  const insightBuckets = result.insights;

  return (
    <div className="space-y-6">
      <Card className={`rounded-[34px] border shadow-[0_24px_70px_rgba(67,53,40,0.08)] ${verdictMeta.panelClass}`}>
        <CardContent className="space-y-8 p-7 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${verdictMeta.badgeClass}`}>
                  {verdictMeta.action}
                </span>
                <span className="text-sm font-medium text-muted-foreground">Werdykt checkera: {verdictMeta.label}</span>
              </div>
              <p className="max-w-3xl text-xl font-semibold leading-8 text-secondary sm:text-2xl">{mainDecisionSentence}</p>
            </div>

            <div className="min-w-[260px] rounded-[28px] border border-border/70 bg-white/85 p-5 shadow-lift">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Punkt odniesienia</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-secondary">{valueHeadline.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{valueHeadline.subtitle}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[26px] border border-border/70 bg-white/82 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Opłacalność</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-secondary">{profitabilityScore}/100</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {profitabilityLabel === "Bierz"
                  ? "Cena i specyfikacja bronią się całkiem dobrze."
                  : profitabilityLabel === "Negocjuj"
                    ? "Da się to rozważyć, ale cena albo opis proszą się o korektę."
                    : profitabilityLabel === "Raczej nie"
                      ? "Na papierze robi się z tego słaby układ."
                      : "Cena i konfiguracja nie składają się w sensowny zakup."}
              </p>
            </div>
            <div className="rounded-[26px] border border-border/70 bg-white/82 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ryzyko</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-secondary">{riskLabel}</p>
              <p className="mt-2 text-sm text-muted-foreground">{result.riskScore}/100. Im wyżej, tym więcej rzeczy trzeba sprawdzić przed zakupem.</p>
            </div>
            <div className="rounded-[26px] border border-border/70 bg-white/82 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Wartość zestawu</p>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-secondary">
                {valueRange ? `${formatCurrency(valueRange.min)}–${formatCurrency(valueRange.max)}` : "Brak pewnej wyceny"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Zakres orientacyjny, zależny od stanu i uczciwości opisu.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-[30px] border-border/70 bg-white/90 shadow-[0_18px_45px_rgba(67,53,40,0.07)]">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dlaczego taki werdykt?</p>
            <ul className="mt-4 space-y-3">
              {whyVerdictPoints.map((point) => (
                <li key={point} className="rounded-[22px] border border-border/70 bg-background/80 p-4 text-sm leading-6 text-secondary">
                  {point}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-border/70 bg-white/90 shadow-[0_18px_45px_rgba(67,53,40,0.07)]">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Wykryte podzespoły</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {parts.map((part) => (
                <div key={part.label} className="rounded-[22px] border border-border/70 bg-background/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{part.label}</p>
                  <p className={`mt-2 text-sm font-medium leading-6 ${part.known ? "text-secondary" : "text-muted-foreground"}`}>
                    {part.value}
                  </p>
                  {part.known && part.confidence && part.confidence !== "high" ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {part.confidence === "medium" ? "Średnia pewność" : "Niska pewność"}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-border/70 bg-white/90 shadow-[0_18px_45px_rgba(67,53,40,0.07)]">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ocena szczegółowa</p>
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-danger">Red flagi</p>
                {(insightBuckets?.red_flags.length ?? result.redFlags.length) === 0 ? (
                  <div className="mt-3 rounded-[22px] border border-success/20 bg-success/10 p-4 text-sm text-secondary">
                    Na tym etapie nie widać dużych czerwonych flag, ale i tak warto potwierdzić stan sprzętu przed zakupem.
                  </div>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {(insightBuckets?.red_flags.map((item) => item.text) ?? result.redFlags).map((flag) => (
                      <li key={flag} className="rounded-[22px] border border-danger/20 bg-danger/8 p-4 text-sm leading-6 text-secondary">
                        {flag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {insightBuckets?.minuses.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-warning">Minusy</p>
                  <ul className="mt-3 space-y-3">
                    {insightBuckets.minuses.map((item) => (
                      <li key={item.reason_code} className="rounded-[22px] border border-warning/25 bg-warning/10 p-4 text-sm leading-6 text-secondary">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {insightBuckets?.to_verify.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Do sprawdzenia</p>
                  <ul className="mt-3 space-y-3">
                    {insightBuckets.to_verify.map((item) => (
                      <li key={item.reason_code} className="rounded-[22px] border border-border/70 bg-background/80 p-4 text-sm leading-6 text-secondary">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {insightBuckets?.positives.length ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Plusy</p>
                  <ul className="mt-3 space-y-3">
                    {insightBuckets.positives.map((item) => (
                      <li key={item.reason_code} className="rounded-[22px] border border-success/20 bg-success/10 p-4 text-sm leading-6 text-secondary">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-border/70 bg-white/90 shadow-[0_18px_45px_rgba(67,53,40,0.07)]">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Co zrobić dalej?</p>
            <ul className="mt-4 space-y-3">
              {actionItems.map((action) => (
                <li key={action} className="rounded-[22px] border border-border/70 bg-background/80 p-4 text-sm leading-6 text-secondary">
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
