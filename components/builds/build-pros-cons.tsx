import type { Build } from "@/types/build";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BuildProsCons({ build }: { build: Build }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Plusy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {build.pros.map((item) => (
            <div key={item} className="rounded-[20px] bg-success/10 p-4 text-sm text-secondary">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Minusy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {build.cons.map((item) => (
            <div key={item} className="rounded-[20px] bg-warning/10 p-4 text-sm text-secondary">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
