import type { Build } from "@/types/build";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BuildProsCons({ build }: { build: Build }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dlaczego ten zestaw</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {build.whyThisBuild.map((item) => (
            <div key={item} className="rounded-[20px] bg-success/10 p-4 text-sm text-secondary">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dla kogo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-[20px] bg-accent/60 p-4 text-sm leading-7 text-secondary">{build.whoIsItFor}</div>
          {build.notes?.length ? (
            <div className="rounded-[20px] bg-warning/10 p-4 text-sm leading-7 text-secondary">{build.notes.join(" ")}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
