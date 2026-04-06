import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-secondary text-secondary-foreground">
      <div className="container-shell grid gap-8 py-10 text-sm md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="space-y-2">
          <p className="font-serif text-2xl">KOMPBRAT</p>
          <p className="max-w-md text-secondary-foreground/80">
            Twój brat od komputerów. Dobór zestawu, szybki check ofert i spokojniejsze decyzje zakupowe bez korpo tonu.
          </p>
        </div>
        <div className="space-y-2 text-secondary-foreground/75">
          <p className="font-semibold text-secondary-foreground">Szybkie wejścia</p>
          <ul className="space-y-1">
            <li><Link href="/builder" className="hover:text-secondary-foreground">Dobierz komputer</Link></li>
            <li><Link href="/checker" className="hover:text-secondary-foreground">Sprawdź ofertę</Link></li>
            <li><Link href="/builds" className="hover:text-secondary-foreground">Przeglądaj buildy</Link></li>
          </ul>
        </div>
        <div className="space-y-2 text-secondary-foreground/75">
          <p className="font-semibold text-secondary-foreground">O produkcie</p>
          <p>Gotowy MVP pod Vercel, portfolio i pierwszy live launch.</p>
          <p>Konkretne copy, spokojny design i prosty flow dla ludzi, którzy chcą kupić komputer mądrzej.</p>
        </div>
      </div>
    </footer>
  );
}
