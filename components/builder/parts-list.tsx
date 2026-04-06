import type { BuilderPart } from "@/types/ai";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PartsList({ parts }: { parts: BuilderPart[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista części</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {parts.map((part) => (
          <div key={`${part.type}-${part.name}`} className="flex items-start justify-between gap-4 rounded-[20px] border p-4">
            <div>
              <p className="text-sm font-semibold text-secondary">{part.type}</p>
              <p className="text-sm text-muted-foreground">{part.name}</p>
            </div>
            {part.condition ? (
              <span className="inline-flex rounded-full border border-border/80 bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {part.condition === "used" ? "Używana" : "Nowa"}
              </span>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
