import type { Build, BuildSpec } from "@/types/build";

type BuildInput = Omit<
  Build,
  "slug" | "price" | "useCase" | "shortVerdict" | "parts" | "pros" | "cons" | "badgeLabel"
>;

function getSpecValue(specs: BuildSpec[], label: string) {
  return specs.find((spec) => spec.label === label)?.value ?? "Brak danych";
}

function getPriceAnchor(priceRange: string) {
  const matches = priceRange.match(/\d+/g);

  if (!matches || matches.length === 0) {
    return 0;
  }

  return Number(matches[matches.length - 1]);
}

function createBuild(input: BuildInput): Build {
  return {
    ...input,
    slug: input.id,
    price: getPriceAnchor(input.priceRange),
    useCase: input.whoIsItFor,
    shortVerdict: input.shortDescription,
    parts: {
      cpu: getSpecValue(input.specs, "Procesor"),
      gpu: getSpecValue(input.specs, "Grafika") !== "Brak danych" ? getSpecValue(input.specs, "Grafika") : getSpecValue(input.specs, "Karta graficzna"),
      ram: getSpecValue(input.specs, "Pamięć RAM"),
      storage: getSpecValue(input.specs, "Dysk SSD"),
      motherboard: getSpecValue(input.specs, "Płyta główna"),
      psu: getSpecValue(input.specs, "Zasilacz"),
      case: getSpecValue(input.specs, "Obudowa"),
    },
    pros: input.whyThisBuild,
    cons: input.notes ?? [],
    badgeLabel: input.featured ? "Handpicked" : undefined,
  };
}

export const workBuilds: Build[] = [
  createBuild({
    id: "work-starter-2000-2500",
    category: "work",
    title: "Work Starter",
    priceRange: "2000–2500 zł",
    sourceType: "new",
    shortDescription:
      "Cichy i opłacalny komputer do biura, nauki, internetu i codziennego użytkowania bez potrzeby montażu dedykowanej karty graficznej.",
    description:
      "Komputer do pracy biurowej, nauki, internetu, wideorozmów i codziennego użytku. Prosty, sensowny i opłacalny zestaw oparty o procesor z grafiką zintegrowaną.",
    whoIsItFor:
      "Do biura, szkoły, domu, pracy z dokumentami, przeglądarką, komunikatorami, nauki online i codziennych zadań.",
    whyThisBuild: [
      "nie wymaga osobnej karty graficznej",
      "dobrze sprawdza się w pracy, nauce i domowym użytkowaniu",
      "jest prosty, tani w utrzymaniu i energooszczędny",
      "daje sensowną bazę pod przyszłą rozbudowę",
    ],
    specs: [
      { label: "Procesor", value: "AMD Ryzen 5 5600G" },
      { label: "Grafika", value: "zintegrowana AMD Radeon Graphics" },
      { label: "Płyta główna", value: "Gigabyte B550M K" },
      { label: "Pamięć RAM", value: "16 GB DDR4 3200 MHz" },
      { label: "Dysk SSD", value: "1 TB NVMe M.2" },
      { label: "Chłodzenie CPU", value: "Endorfy Fera 5 Black" },
      { label: "Zasilacz", value: "Endorfy Vero L5 Bronze 600W" },
      { label: "Obudowa", value: "Zalman S3" },
    ],
    tags: ["Praca", "Biuro", "Nauka", "iGPU", "new"],
    featured: true,
    variant: "starter",
    status: "active",
  }),
  createBuild({
    id: "work-plus-3000-3500",
    category: "work",
    title: "Work Plus",
    priceRange: "3000–3500 zł",
    sourceType: "new",
    shortDescription:
      "Nowocześniejszy zestaw do pracy, nauki, programowania i multitaskingu oparty o platformę AM5 i wydajną grafikę zintegrowaną.",
    description:
      "Komputer do pracy, nauki, programowania i codziennego multitaskingu. Nowoczesny zestaw oparty o platformę AM5 i procesor z wydajną grafiką zintegrowaną, dzięki czemu nie wymaga osobnej karty graficznej.",
    whoIsItFor:
      "Do pracy biurowej, studiów, programowania, wielu kart w przeglądarce, pracy na kilku aplikacjach jednocześnie oraz codziennego użytkowania.",
    whyThisBuild: [
      "nie wymaga dedykowanej karty graficznej",
      "oferuje nowoczesną platformę AM5",
      "dobrze sprawdza się w pracy i multitaskingu",
      "daje sensowną bazę pod przyszłą rozbudowę",
    ],
    specs: [
      { label: "Procesor", value: "AMD Ryzen 5 8600G" },
      { label: "Grafika", value: "zintegrowana AMD Radeon Graphics" },
      { label: "Płyta główna", value: "Biostar B650MT" },
      { label: "Pamięć RAM", value: "32 GB DDR5 6000 MHz" },
      { label: "Dysk SSD", value: "1 TB NVMe M.2" },
      { label: "Chłodzenie CPU", value: "Endorfy Fera 5 Black" },
      { label: "Zasilacz", value: "Endorfy Vero L5 Bronze 600W" },
      { label: "Obudowa", value: "Zalman S3" },
    ],
    tags: ["Praca", "Programowanie", "Multitasking", "AM5", "new"],
    featured: true,
    variant: "plus",
    status: "active",
  }),
  createBuild({
    id: "creator-heavy-work-5000-5500",
    category: "work",
    title: "Creator / Heavy Work",
    priceRange: "5000–5500 zł",
    sourceType: "new",
    shortDescription:
      "Zestaw do cięższej pracy, tworzenia treści, montażu, grafiki i wielu aplikacji jednocześnie z dedykowaną kartą graficzną.",
    description:
      "Komputer do cięższej pracy, tworzenia treści, montażu, grafiki, wielu aplikacji jednocześnie oraz codziennej pracy na nowoczesnej platformie Intel.",
    whoIsItFor:
      "Do montażu, grafiki, tworzenia treści, pracy kreatywnej, bardziej wymagającego multitaskingu oraz jako wejściowy workstation/creator build.",
    whyThisBuild: [
      "nowoczesna platforma Intel",
      "32 GB pamięci DDR5 w standardzie",
      "dedykowana karta graficzna 12 GB",
      "dobra baza do pracy kreatywnej i rozbudowy",
      "przewiewna obudowa i mocne chłodzenie powietrzne",
    ],
    specs: [
      { label: "Procesor", value: "Intel Core Ultra 5 250K Plus" },
      { label: "Karta graficzna", value: "Intel Arc B580 12 GB GDDR6" },
      { label: "Płyta główna", value: "ASRock Z890 Pro-A" },
      { label: "Pamięć RAM", value: "32 GB DDR5 6000 MHz" },
      { label: "Dysk SSD", value: "1 TB NVMe M.2" },
      { label: "Chłodzenie CPU", value: "Thermalright Peerless Assassin 120 SE" },
      { label: "Zasilacz", value: "Gigabyte P750GM 750W" },
      { label: "Obudowa", value: "Fractal Design Pop Air Solid" },
    ],
    tags: ["Creator", "Heavy Work", "Montaż", "Grafika", "new"],
    featured: true,
    variant: "creator",
    status: "active",
  }),
];

export const gamingBuilds: Build[] = [
  // Placeholder pod przyszłe segmenty GAMING.
  // Zasady, które trzeba zachować przy dopisywaniu:
  // - 2000–2500 zł: tylko "used" albo "mixed"
  // - 3000 zł: dwie osobne wersje "new" oraz "mixed"
  // - powyżej 4000 zł: tylko "new"
];

export const handpickedBuilds: Build[] = [...workBuilds, ...gamingBuilds];
