type BuildVerdictProps = {
  verdict: string;
  description: string;
  badgeLabel?: string;
  compact?: boolean;
};

export function BuildVerdict({ verdict, description, badgeLabel, compact = false }: BuildVerdictProps) {
  return (
    <div className={`rounded-[24px] bg-secondary text-secondary-foreground ${compact ? "p-4" : "p-6"}`}>
      {badgeLabel ? (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground/70">{badgeLabel}</p>
      ) : null}
      <p className={`font-semibold ${badgeLabel ? "mt-3" : ""} ${compact ? "text-base" : "text-lg"}`}>{verdict}</p>
      <p className="mt-3 text-sm leading-7 text-secondary-foreground/80">{description}</p>
    </div>
  );
}
