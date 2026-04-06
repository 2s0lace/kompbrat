import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  label?: string;
  steps?: string[];
  activeStep?: number;
};

export function LoadingState({ label = "Ładowanie...", steps, activeStep = 0 }: LoadingStateProps) {
  return (
    <div aria-live="polite" className="rounded-[28px] border border-border/80 bg-card/85 p-6 text-sm text-muted-foreground shadow-panel">
      <div className="flex items-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        <span>{label}</span>
      </div>
      {steps && steps.length > 0 ? (
        <div className="mt-5 space-y-3">
          {steps.map((step, index) => {
            const isDone = index < activeStep;
            const isActive = index === activeStep;

            return (
              <div key={step} className="flex items-center gap-3">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    isDone ? "bg-success" : isActive ? "bg-primary animate-pulse" : "bg-border"
                  }`}
                />
                <span className={isActive ? "text-secondary" : isDone ? "text-secondary/85" : "text-muted-foreground"}>{step}</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
