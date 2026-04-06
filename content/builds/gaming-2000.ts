import type { Build } from "@/types/build";
import { buildAllegroLink } from "@/lib/affiliate/allegro";
import { buildCeneoLink } from "@/lib/affiliate/ceneo";

const gaming2000: Build = {
  slug: "gaming-2000",
  title: "Zestaw gamingowy do 2000 zł",
  price: 1999,
  category: "gaming",
  sourceType: "sklep",
  useCase: "Budżetowy gaming 1080p dla kogoś, kto chce wejść w granie bez przepalania kasy.",
  shortVerdict: "Najtańszy sensowny start do grania, bez udawania high-endu.",
  description:
    "To jest build dla osoby, która chce po prostu odpalić gry w 1080p i mieć bazę pod przyszły upgrade. Nie błyszczy RGB, ale robi robotę tam, gdzie ma robić.",
  parts: {
    cpu: "AMD Ryzen 5 5600",
    gpu: "Radeon RX 6600 8 GB",
    ram: "32 GB DDR4 3200",
    storage: "1 TB NVMe Gen4",
    motherboard: "B550 mATX",
    psu: "650 W 80+ Bronze",
    case: "Przewiewna obudowa mATX z 3 wentylatorami",
  },
  pros: [
    "Bardzo dobry punkt wejścia do grania w 1080p",
    "32 GB RAM już na starcie daje spokój na dłużej",
    "Łatwy upgrade karty graficznej w przyszłości",
  ],
  cons: [
    "To nie jest zestaw pod ambitne 1440p",
    "Bronze PSU jest OK, ale bez premium zapasu",
    "Najtańsza półka oznacza mniej miejsca na fanaberie",
  ],
  affiliateLinks: [
    {
      label: "Sprawdź na Ceneo",
      provider: "ceneo",
      url: buildCeneoLink("Ryzen 5 5600 RX 6600 B550 32GB 1TB", { slug: "gaming-2000", tag: "gaming-2000-ceneo" }),
      tag: "gaming-2000-ceneo",
    },
    {
      label: "Zobacz na Allegro",
      provider: "allegro",
      url: buildAllegroLink("Ryzen 5 5600 RX 6600 32GB 1TB", { slug: "gaming-2000", tag: "gaming-2000-allegro" }),
      tag: "gaming-2000-allegro",
    },
    {
      label: "Kup w sklepie",
      provider: "sklep",
      url: "https://www.x-kom.pl/szukaj?q=Ryzen%205%205600%20RX%206600",
      tag: "gaming-2000-sklep",
    },
  ],
  badgeLabel: "KOMPBRAT poleca",
};

export default gaming2000;
