type VerdictBadgeProps = {
  verdict: "dobra okazja" | "średnia" | "nieopłacalna" | "podejrzanie dobra";
};

const verdictMap: Record<VerdictBadgeProps["verdict"], string> = {
  "dobra okazja": "Dobra okazja",
  "średnia": "Średnia",
  "nieopłacalna": "Nieopłacalna",
  "podejrzanie dobra": "Podejrzanie dobra",
};

export function VerdictBadge({ verdict }: VerdictBadgeProps) {
  const styles = {
    "dobra okazja": "bg-success/15 text-success",
    "średnia": "bg-warning/15 text-warning",
    "nieopłacalna": "bg-danger/15 text-danger",
    "podejrzanie dobra": "bg-tertiary/15 text-secondary",
  }[verdict];

  return <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${styles}`}>{verdictMap[verdict]}</span>;
}
