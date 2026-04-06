type ScoreBarProps = {
  score: number;
  label?: string;
  mode?: "value" | "risk";
};

export function ScoreBar({ score, label = "Ocena", mode = "value" }: ScoreBarProps) {
  const colorClass =
    mode === "risk"
      ? score >= 75
        ? "bg-danger"
        : score >= 50
          ? "bg-warning"
          : "bg-success"
      : score >= 75
        ? "bg-success"
        : score >= 50
          ? "bg-warning"
          : "bg-danger";

  return (
    <div className="space-y-2" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-3 rounded-full bg-neutral">
        <div className={`h-3 rounded-full transition-all ${colorClass}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
