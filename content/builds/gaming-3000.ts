import type { Build } from "@/types/build";
import { buildAllegroLink } from "@/lib/affiliate/allegro";
import { buildCeneoLink } from "@/lib/affiliate/ceneo";

const gaming3000: Build = {
  slug: "gaming-3000",
  title: "Zestaw gamingowy do 3000 zł",
  price: 2999,
  category: "gaming",
  sourceType: "sklep",
  useCase: "Mocny balans pod 1080p ultra i sensowny start w 1440p.",
  shortVerdict: "Najbardziej zbalansowany build dla większości graczy.",
  description:
    "Jeśli nie chcesz przesadzać z budżetem, ale zależy Ci na sensownym zapasie mocy, to tutaj zaczyna się naprawdę wygodny gaming. To build, który nie wymaga tłumaczenia się z każdego wyboru.",
  parts: {
    cpu: "AMD Ryzen 5 7500F",
    gpu: "GeForce RTX 4060",
    ram: "32 GB DDR5 6000",
    storage: "1 TB NVMe Gen4",
    motherboard: "B650 ATX",
    psu: "750 W 80+ Gold",
    case: "Przewiewna obudowa ATX z filtrem i szkłem",
  },
  pros: [
    "Bardzo dobry stosunek wydajności do ceny",
    "Nowa platforma daje prostszy upgrade później",
    "Nadaje się nie tylko do gier, ale też do lekkiego montażu",
  ],
  cons: [
    "RTX 4060 bywa krytykowany za surową opłacalność",
    "1 TB SSD może szybko przestać wystarczać",
    "To nadal nie jest build pod bezkompromisowe 4K",
  ],
  affiliateLinks: [
    {
      label: "Sprawdź na Ceneo",
      provider: "ceneo",
      url: buildCeneoLink("Ryzen 5 7500F RTX 4060 B650 32GB DDR5", { slug: "gaming-3000", tag: "gaming-3000-ceneo" }),
      tag: "gaming-3000-ceneo",
    },
    {
      label: "Zobacz na Allegro",
      provider: "allegro",
      url: buildAllegroLink("Ryzen 5 7500F RTX 4060 32GB DDR5", { slug: "gaming-3000", tag: "gaming-3000-allegro" }),
      tag: "gaming-3000-allegro",
    },
    {
      label: "Kup w sklepie",
      provider: "sklep",
      url: "https://www.morele.net/wyszukiwarka/?q=Ryzen%205%207500F%20RTX%204060",
      tag: "gaming-3000-sklep",
    },
  ],
  badgeLabel: "KOMPBRAT poleca",
};

export default gaming3000;
