import type { Build } from "@/types/build";
import { buildAllegroLink } from "@/lib/affiliate/allegro";
import { buildCeneoLink } from "@/lib/affiliate/ceneo";

const work2500: Build = {
  slug: "work-2500",
  title: "Zestaw do pracy i nauki do 2500 zł",
  price: 2499,
  category: "praca",
  sourceType: "sklep",
  useCase: "Zestaw do pracy, nauki, przeglądarki, pakietu biurowego i lekkich zadań kreatywnych.",
  shortVerdict: "Praktyczny build do roboty, bez przepalania kasy na kartę graficzną.",
  description:
    "Jeśli komputer ma być głównie narzędziem do pracy i nauki, to tutaj liczy się cisza, responsywność i brak głupich kompromisów. To nie jest build pod gaming, tylko pod wygodną codzienność.",
  parts: {
    cpu: "Intel Core i5-14400",
    gpu: "Zintegrowana grafika Intel UHD",
    ram: "32 GB DDR5",
    storage: "1 TB NVMe",
    motherboard: "B760 mATX",
    psu: "550 W 80+ Bronze",
    case: "Cicha obudowa micro-ATX",
  },
  pros: [
    "Cichy i szybki do pracy wielozadaniowej",
    "32 GB RAM daje zapas pod długą pracę i wiele kart",
    "Bez dokładania drogiego GPU łatwiej zmieścić się w budżecie",
  ],
  cons: [
    "To nie jest build do ciężkiego gamingu",
    "Zintegrowana grafika ogranicza zastosowania 3D",
    "Przy większym montażu wideo szybko poczujesz sufit",
  ],
  affiliateLinks: [
    {
      label: "Sprawdź na Ceneo",
      provider: "ceneo",
      url: buildCeneoLink("Intel Core i5-14400 B760 32GB DDR5 1TB", { slug: "work-2500", tag: "work-2500-ceneo" }),
      tag: "work-2500-ceneo",
    },
    {
      label: "Zobacz na Allegro",
      provider: "allegro",
      url: buildAllegroLink("Intel Core i5-14400 32GB DDR5 1TB", { slug: "work-2500", tag: "work-2500-allegro" }),
      tag: "work-2500-allegro",
    },
    {
      label: "Kup w sklepie",
      provider: "sklep",
      url: "https://www.x-kom.pl/szukaj?q=Intel%20Core%20i5-14400%2032GB%20DDR5",
      tag: "work-2500-sklep",
    },
  ],
  badgeLabel: "KOMPBRAT poleca",
};

export default work2500;
