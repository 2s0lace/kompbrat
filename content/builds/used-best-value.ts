import type { Build } from "@/types/build";
import { buildAllegroLink } from "@/lib/affiliate/allegro";

const usedBestValue: Build = {
  slug: "used-best-value",
  title: "Używany zestaw z mocnym stosunkiem ceny do wydajności",
  price: 2699,
  category: "uzywany",
  sourceType: "olx-allegro",
  useCase: "Szablon pod sensowne używki z OLX i Allegro, gdy liczy się opłacalność, a nie pachnące pudełko.",
  shortVerdict: "Najlepsza opcja dla kogoś, kto umie dopytać i nie bierze pierwszej lepszej oferty.",
  description:
    "To nie jest jeden konkretny listing, tylko wzorzec dobrego używanego buildu. Chodzi o to, żeby wiedzieć, za czym patrzeć i czego unikać, zanim wtopisz w zmęczony zestaw po przejściach.",
  parts: {
    cpu: "Ryzen 5 5600 lub Intel Core i5-12400F",
    gpu: "RTX 3060 Ti lub RX 6700 XT",
    ram: "32 GB DDR4",
    storage: "1 TB NVMe",
    motherboard: "B550 lub B660",
    psu: "650 W markowy zasilacz",
    case: "Używana obudowa z sensownym airflow",
  },
  pros: [
    "Najlepszy stosunek wydajności do ceny, jeśli trafisz dobrą ofertę",
    "Za ten budżet można wyrwać mocniejsze GPU niż w nowych zestawach",
    "Dobre odniesienie do sprawdzania listingów z OLX i Allegro",
  ],
  cons: [
    "Większe ryzyko ukrytych problemów niż w sklepie",
    "Trzeba umieć dopytać o historię sprzętu i gwarancję",
    "Jakość finalnego zestawu zależy od konkretnej oferty, nie od samej specyfikacji",
  ],
  sourceLinks: [
    {
      label: "Szukaj na OLX",
      provider: "olx",
      url: "https://www.olx.pl/oferty/q-ryzen-5600-rtx-3060-ti/",
      tag: "used-best-value-olx",
    },
    {
      label: "Zobacz na Allegro",
      provider: "allegro",
      url: buildAllegroLink("Ryzen 5 5600 RTX 3060 Ti 32GB", { slug: "used-best-value", tag: "used-best-value-allegro" }),
      tag: "used-best-value-allegro",
    },
  ],
  badgeLabel: "KOMPBRAT poleca",
};

export default usedBestValue;
