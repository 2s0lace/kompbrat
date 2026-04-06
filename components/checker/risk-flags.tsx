export function RiskFlags({ flags }: { flags: string[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-secondary">Flagi ryzyka</p>
      {flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Brak wykrytych flag.</p>
      ) : (
        <ul className="space-y-3">
          {flags.map((flag) => (
            <li key={flag} className="rounded-[20px] border border-warning/30 bg-warning/10 p-4">
              <p className="text-sm text-secondary">{flag}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
