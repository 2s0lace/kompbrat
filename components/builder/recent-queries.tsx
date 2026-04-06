import type { RecentBuilderQuery } from "@/types/ai";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RecentQueriesProps = {
  queries: RecentBuilderQuery[];
  onSelectQuery: (prompt: string) => void;
  onClear: () => void;
};

export function RecentQueries({ queries, onSelectQuery, onClear }: RecentQueriesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Ostatnie zapytania</CardTitle>
        {queries.length > 0 ? (
          <Button type="button" variant="ghost" className="shrink-0" onClick={onClear}>
            Wyczyść
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {queries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Na razie pusto. Wyślij pierwszy brief i wrócimy tu z historią.</p>
        ) : (
          queries.map((query) => (
            <button
              key={query.id}
              type="button"
              className="w-full rounded-[20px] border border-border/80 bg-card/70 p-4 text-left transition hover:bg-neutral"
              onClick={() => onSelectQuery(query.prompt)}
            >
              <p className="text-sm font-medium text-secondary">{query.prompt}</p>
              {query.buildName ? <p className="mt-2 text-sm text-muted-foreground">{query.buildName}</p> : null}
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {new Date(query.createdAt).toLocaleString("pl-PL")}
              </p>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}
