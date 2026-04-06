import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export function CtaBanner() {
  return (
    <section className="container-shell py-12">
      <div className="rounded-[36px] border bg-[linear-gradient(135deg,#fff8ee_0%,#eef8f3_100%)] p-8 shadow-panel sm:p-10">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">KOMPBRAT</p>
          <h2 className="font-serif text-3xl text-secondary sm:text-4xl">Masz budżet albo ofertę. Resztę ogarniemy prościej.</h2>
          <p className="text-muted-foreground">
            Builder pomaga dobrać zestaw, checker wyłapuje słabe okazje, a handpicked buildy dają Ci gotowe punkty startowe bez forumowego chaosu.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/builder" className={cn(buttonVariants({ variant: "default" }))}>
              Dobierz komputer
            </Link>
            <Link href="/checker" className={cn(buttonVariants({ variant: "outline" }))}>
              Sprawdź ofertę
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
