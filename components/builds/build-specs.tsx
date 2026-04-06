import type { Build } from "@/types/build";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBuildPartsEntries } from "@/lib/builds/utils";

export function BuildSpecs({ build }: { build: Build }) {
  const parts = getBuildPartsEntries(build.parts);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Specyfikacja</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {parts.map((part) => (
          <div key={`${part.label}-${part.value}`} className="flex items-start justify-between gap-4 rounded-[20px] border p-4">
            <div>
              <p className="text-sm font-semibold text-secondary">{part.label}</p>
              <p className="text-sm text-muted-foreground">{part.value}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
