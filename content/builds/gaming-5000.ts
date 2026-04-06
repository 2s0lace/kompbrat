import type { Build } from "@/types/build";
import { buildAllegroLink } from "@/lib/affiliate/allegro";
import { buildCeneoLink } from "@/lib/affiliate/ceneo";

const gaming5000: Build = {
  slug: "gaming-5000",
  title: "Zestaw gamingowy do 5000 zł",
  price: 4999,
  category: "gaming",
  sourceType: "sklep",
  useCase: "Build dla osoby, która celuje w mocne 1440p i sensowny zapas na najbliższe lata.",
  shortVerdict: "Mocny wybór, jeśli chcesz po prostu kupić raz i mieć spokój.",
  description:
    "Ten zestaw jest dla kogoś, kto nie chce co chwilę kombinować z wymianą części. Ma mocny GPU, porządny zasilacz i platformę, która nie zestarzeje się po paru miesiącach.",
  parts: {
    cpu: "AMD Ryzen 7 7700",
    gpu: "Radeon RX 7800 XT",
    ram: "32 GB DDR5 6000",
    storage: "2 TB NVMe Gen4",
    motherboard: "B650 ATX z Wi-Fi",
    psu: "750 W 80+ Gold",
    case: "Przewiewna obudowa mid tower premium",
  },
  pros: [
    "Świetny build pod 1440p high/ultra",
    "2 TB SSD i sensowna kultura pracy już na starcie",
    "Mocna baza pod dłuższe użytkowanie bez upgrade panic",
  ],
  cons: [
    "Budżet wyraźnie wyższy niż najbardziej opłacalny punkt rynku",
    "Do samego e-sportu to overkill",
    "W tej cenie trzeba pilnować aktualnych promocji",
  ],
  affiliateLinks: [
    {
      label: "Sprawdź na Ceneo",
      provider: "ceneo",
      url: buildCeneoLink("Ryzen 7 7700 RX 7800 XT B650 32GB 2TB", { slug: "gaming-5000", tag: "gaming-5000-ceneo" }),
      tag: "gaming-5000-ceneo",
    },
    {
      label: "Zobacz na Allegro",
      provider: "allegro",
      url: buildAllegroLink("Ryzen 7 7700 RX 7800 XT 32GB 2TB", { slug: "gaming-5000", tag: "gaming-5000-allegro" }),
      tag: "gaming-5000-allegro",
    },
    {
      label: "Kup w sklepie",
      provider: "sklep",
      url: "https://www.x-kom.pl/szukaj?q=Ryzen%207%207700%20RX%207800%20XT",
      tag: "gaming-5000-sklep",
    },
  ],
  badgeLabel: "KOMPBRAT poleca",
};

export default gaming5000;
