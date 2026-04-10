import type { Build } from "@/types/build";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BuildSpecs({ build }: { build: Build }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Specyfikacja</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {build.specs.map((spec) => (
          <div key={`${build.id}-${spec.label}`} className="rounded-[20px] border p-4">
            <p className="text-sm font-semibold text-secondary">{spec.label}</p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{spec.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
