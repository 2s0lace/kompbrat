export function HowItWorks() {
  const steps = [
    {
      title: "Powiedz budżet i zastosowanie",
      description: "Kilka zdań o tym, do czego ma być komputer, wystarczy na sensowny punkt startowy.",
    },
    {
      title: "Brat dobiera sprzęt",
      description: "Builder składa logiczną propozycję i pokazuje kompromisy zamiast wciskać przypadkowe części.",
    },
    {
      title: "Sprawdź opłacalność i kupuj mądrzej",
      description: "Checker przesiewa oferty i wychwytuje red flagi z OLX oraz Allegro zanim klikniesz kup.",
    },
  ];

  return (
    <section className="container-shell animate-fade-up-delay py-10 sm:py-14">
      <div className="surface-panel p-8 sm:p-10">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Jak to działa</p>
          <h2 className="font-serif text-3xl tracking-tight text-secondary">Prosty flow, który prowadzi do decyzji</h2>
          <p className="text-muted-foreground">
            Bez neon gamingu i bez SaaS-owego nadmuchania. Tylko logiczne kroki, które pomagają wybrać lepiej i szybciej.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-lift">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Krok 0{index + 1}
              </p>
              <h3 className="font-serif text-2xl text-secondary">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
