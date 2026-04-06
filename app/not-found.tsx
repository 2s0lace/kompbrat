import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export default function NotFound() {
  return (
    <PageShell
      eyebrow="404"
      title="Tego miejsca jeszcze nie ma"
      description="Wygląda na to, że link jest nieaktualny albo strona po prostu nie istnieje. Wróćmy do czegoś, co faktycznie pomoże dobrać komputer."
    >
      <EmptyState
        title="Nic tu nie znaleźliśmy"
        description="Możesz wrócić na stronę główną, sprawdzić ofertę albo przejść do buildera i zacząć od nowa."
      />
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
          Strona główna
        </Link>
        <Link href="/builder" className={cn(buttonVariants({ variant: "outline" }))}>
          Dobierz komputer
        </Link>
        <Link href="/checker" className={cn(buttonVariants({ variant: "outline" }))}>
          Sprawdź ofertę
        </Link>
      </div>
    </PageShell>
  );
}
