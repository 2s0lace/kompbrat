"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MAX_BUILDER_BUDGET } from "@/lib/builder/budget-guardrails";

type BuilderFormProps = {
  value: string;
  selectedMode: "new" | "mixed" | "used";
  isPending: boolean;
  onChange: (value: string) => void;
  onModeChange: (value: "new" | "mixed" | "used") => void;
  onSave: () => void;
  onSubmit: () => void;
};

const buildModes = [
  {
    id: "new" as const,
    label: "New",
    description: "Nowe części, większy spokój i gwarancja.",
  },
  {
    id: "mixed" as const,
    label: "Mixed",
    description: "Miks nowych i używanych dla lepszej opłacalności.",
  },
  {
    id: "used" as const,
    label: "Used",
    description: "Maks wydajności za budżet, ale większe ryzyko.",
  },
];

export function BuilderForm({ value, selectedMode, isPending, onChange, onModeChange, onSave, onSubmit }: BuilderFormProps) {
  const promptId = "builder-prompt";
  const hintId = "builder-prompt-hint";
  const modeHintId = "builder-mode-hint";

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle>Brief użytkownika</CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          Napisz normalnie, jak do człowieka. Budżet, zastosowanie, czy wolisz ciszę, upgrade, używki albo brak RGB.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-secondary">Tryb zestawu</p>
              <p id={modeHintId} className="text-sm text-muted-foreground">
                Możesz wybrać tryb ręcznie. Jeśli w tym trybie nie da się ułożyć sensownego zestawu, zaproponujemy lepszą alternatywę.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3" aria-describedby={modeHintId}>
              {buildModes.map((mode) => {
                const isActive = selectedMode === mode.id;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onModeChange(mode.id)}
                    className={`rounded-[22px] border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-primary/40 bg-primary/8 shadow-sm"
                        : "border-border/80 bg-card/80 hover:border-primary/20 hover:bg-card"
                    }`}
                  >
                    <p className="text-sm font-semibold text-secondary">{mode.label}</p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">{mode.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor={promptId} className="text-sm font-semibold text-secondary">
              Opisz budżet, zastosowanie i preferencje
            </label>
            <p id={hintId} className="text-sm text-muted-foreground">
              Im więcej konkretów, tym lepsza odpowiedź. Wystarczą 2-3 zdania. Na ten moment builder obsługuje budżety do{" "}
              {MAX_BUILDER_BUDGET.toLocaleString("pl-PL")} zł.
            </p>
            <Textarea
              id={promptId}
              aria-describedby={hintId}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Np. Mam 3500 zł, gram głównie w CS2 i Fortnite, zależy mi na ciszy i bez RGB."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={onSave} disabled={isPending}>
              Zapisz brief lokalnie
            </Button>
            <Button type="submit" disabled={isPending || !value.trim()}>
              {isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Dobieram zestaw...
                </>
              ) : (
                "Dobierz komputer"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
