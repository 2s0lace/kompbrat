export type BuildCategory = "gaming" | "work";
export type MarketMode = "new" | "used" | "mixed";
export type AllocationPriority =
  | "gpu-first"
  | "cpu-first"
  | "ram-ssd-first"
  | "balanced-platform"
  | "avoid-overspending-on-case"
  | "avoid-overspending-on-cooling"
  | "quiet-work-balance";

export type BudgetGuideline = {
  budget: number;
  category: BuildCategory;
  marketPreference: MarketMode;
  realisticRange: {
    min: number;
    max: number;
  };
  summary: string;
  budgetSplitNote: string;
  allocationPriorities: AllocationPriority[];
  gpuRules: {
    minimumTier: string[];
    preferredTier: string[];
    acceptableTier?: string[];
    bannedTier: string[];
  };
  cpuRules: {
    minimumTier: string[];
    preferredTier: string[];
    bannedTier?: string[];
  };
  minimumStandards: {
    ramGb: number;
    storageGb: number;
    psuNote: string;
    motherboardNote: string;
    coolingNote?: string;
    caseNote?: string;
  };
  pricingNotes: string[];
  goodExamples: string[];
  badExamples: string[];
  llmInstructions: string[];
};

const gamingBudgetSteps = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 7500, 8000, 8500, 9000, 9500, 10000];
const workBudgetSteps = [1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000];

function createTemplateGuideline(input: {
  budget: number;
  category: BuildCategory;
  marketPreference: MarketMode;
  realisticRange: {
    min: number;
    max: number;
  };
  ramGb: number;
  storageGb: number;
}) {
  const allocationPriorities: AllocationPriority[] =
    input.category === "gaming"
      ? ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"]
      : ["cpu-first", "ram-ssd-first", "quiet-work-balance", "balanced-platform"];

  return {
    budget: input.budget,
    category: input.category,
    marketPreference: input.marketPreference,
    realisticRange: input.realisticRange,
    summary: "",
    budgetSplitNote: "",
    allocationPriorities,
    gpuRules: {
      minimumTier: [""],
      preferredTier: [""],
      acceptableTier: [""],
      bannedTier: [""],
    },
    cpuRules: {
      minimumTier: [""],
      preferredTier: [""],
      bannedTier: [""],
    },
    minimumStandards: {
      ramGb: input.ramGb,
      storageGb: input.storageGb,
      psuNote: "",
      motherboardNote: "",
      coolingNote: input.category === "work" ? "" : undefined,
      caseNote: "",
    },
    pricingNotes: [""],
    goodExamples: [""],
    badExamples: [""],
    llmInstructions: [
      "użyj tego guideline'u jako guardraila, ale nie pokazuj użytkownikowi jego nazwy ani bracketu",
      "",
    ],
  } satisfies BudgetGuideline;
}

function createMarketFallbackGuideline(input: {
  budget: number;
  category: BuildCategory;
  marketPreference: MarketMode;
}) {
  const ramGb = input.category === "work" ? (input.budget >= 6000 ? 32 : 16) : 16;
  const storageGb = input.budget < 2200 ? 500 : 1000;
  const template = createTemplateGuideline({
    budget: input.budget,
    category: input.category,
    marketPreference: input.marketPreference,
    realisticRange:
      input.budget <= 2000 ? { min: Math.max(700, input.budget - 200), max: input.budget + 200 } : { min: input.budget - 250, max: input.budget + 350 },
    ramGb,
    storageGb,
  });

  if (input.category === "gaming") {
    return {
      ...template,
      summary:
        input.marketPreference === "new"
          ? "Nowy build value-first z kompromisami, bez udawania premium standardu jako minimum."
          : input.marketPreference === "mixed"
            ? "Mieszany build value-first, gdzie wolno brać używane części tam, gdzie robią największą różnicę."
            : "Used build value-first, gdzie najważniejsze jest wyciśnięcie maksymalnego sensu z budżetu.",
      budgetSplitNote:
        input.budget < 2200
          ? "W tej kasie najwięcej sensu ma GPU i podstawowa stabilność reszty, nie platformowe luksusy."
          : "To ma być zestaw praktyczny i opłacalny, a nie premium build na siłę.",
      minimumStandards: {
        ...template.minimumStandards,
        psuNote: input.budget < 2200 ? "markowy, podstawowy PSU jest ważniejszy niż bajery" : "PSU ma być po prostu sensowny i bez no-name oszczędności",
        motherboardNote: input.budget < 2200 ? "podstawowa płyta jest okej, byle była sprawna i kompatybilna" : "platforma ma mieć sens, ale nie może przepalać budżetu",
        caseNote: "prosta, przewiewna obudowa wystarczy",
      },
      llmInstructions: [
        "jeśli budżet jest niski, zwracaj build z kompromisami zamiast udawać, że nic się nie da złożyć",
        "nie traktuj 32 GB RAM, 1 TB NVMe i premium platformy jako obowiązkowego minimum",
      ],
    } satisfies BudgetGuideline;
  }

  return {
    ...template,
    summary: "Praktyczny build do pracy bez sztucznego premium minimum.",
    budgetSplitNote: "Najpierw CPU, RAM i SSD, a dopiero potem reszta.",
    minimumStandards: {
      ...template.minimumStandards,
      psuNote: "PSU ma być stabilny i bezpieczny, ale nie premium na pokaz",
      motherboardNote: "płyta ma być rozsądna i zgodna z CPU",
      caseNote: "obudowa może być prosta, byle funkcjonalna",
    },
    llmInstructions: [
      "jeśli build działa sensownie do pracy, nie odrzucaj go tylko dlatego, że nie jest premium",
    ],
  } satisfies BudgetGuideline;
}

const gamingOverrides: Record<number, BudgetGuideline> = {
  1000: {
    budget: 1000,
    category: "gaming",
    marketPreference: "used",
    realisticRange: { min: 900, max: 1200 },
    summary: "Ultra budżetowy gaming, gdzie liczy się czyste value i rynek używany.",
    budgetSplitNote: "W tej kasie większość budżetu ma pójść w możliwie sensowne GPU i podstawową stabilność, nie w platformowe luksusy.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["GTX 1060 6GB", "RX 580 8GB"],
      preferredTier: ["GTX 1660 Super", "RX 5600 XT"],
      bannedTier: ["GT 1030", "GTX 1050", "zintegrowana grafika"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
      preferredTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
      bannedTier: ["Intel Core i5-7400", "Ryzen 3 1200"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 500,
      psuNote: "nie bierz no-name PSU i nie pakuj HDD jako jedynego dysku",
      motherboardNote: "starsza płyta jest okej, byle nie była trupem bez sensownej sekcji i BIOS-u",
      caseNote: "obudowa ma być po prostu funkcjonalna i przewiewna",
    },
    pricingNotes: ["stan używanych części mocno wpływa na wartość", "SSD i PSU potrafią mocno zmieniać sens całego zestawu"],
    goodExamples: ["Ryzen 5 3600 + GTX 1660 Super + 16 GB + SSD"],
    badExamples: ["8 GB RAM jako docelowa konfiguracja", "ładna obudowa i słabe GPU"],
    llmInstructions: ["priorytet to czyste fps za złotówkę", "nie udawaj, że platforma jest ważniejsza od GPU w tym budżecie"],
  },
  1500: {
    budget: 1500,
    category: "gaming",
    marketPreference: "used",
    realisticRange: { min: 1350, max: 1700 },
    summary: "Budżet nadal bardzo używkowy, ale da się już celować w sensowniejsze 1080p.",
    budgetSplitNote: "Większość sensu nadal ma iść w GPU, a platforma ma tylko nie przeszkadzać.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 2060", "Radeon RX 6600"],
      preferredTier: ["RTX 2060 Super", "Radeon RX 6600 XT", "Radeon RX 6700 10 GB"],
      bannedTier: ["GTX 1650", "GTX 1050 Ti", "Radeon RX 570 4 GB"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
      preferredTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
      bannedTier: ["Intel Core i5-8400", "Ryzen 5 1600"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 500,
      psuNote: "nie tnij zasilacza tylko po to, żeby zmieścić GPU o pół klasy wyżej",
      motherboardNote: "płyta ma być po prostu sprawna i kompatybilna",
      caseNote: "bez przepalania kasy na szkło i RGB",
    },
    pricingNotes: ["RTX 2070 i 2070 Super bywają dealem, ale nie zakładaj ich jako standardu", "używane GPU potrafi dać największy skok value"],
    goodExamples: ["Ryzen 5 3600 + RTX 2060", "Intel Core i5-10400F + RX 6600"],
    badExamples: ["32 GB RAM kosztem słabego GPU", "AIO w budżecie, który ledwo spina GPU"],
    llmInstructions: ["trzymaj rekomendację realistyczną, nie opartą o pojedynczy cudowny deal", "nie pokazuj użytkownikowi nazw bracketów"],
  },
  2000: {
    budget: 2000,
    category: "gaming",
    marketPreference: "used",
    realisticRange: { min: 1800, max: 2200 },
    summary: "Bardzo mocny punkt wejścia w sensowne 1080p, dalej głównie na używkach.",
    budgetSplitNote: "Nadal bronisz przede wszystkim klasy GPU, a 32 GB RAM nie może zabrać budżetu karcie.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 3060", "Radeon RX 6600 XT"],
      preferredTier: ["Radeon RX 6700", "Radeon RX 6700 XT"],
      bannedTier: ["RTX 2060", "RTX 3050", "GTX 1660 Super"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
      preferredTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
      bannedTier: ["Ryzen 5 2600", "Intel Core i5-9400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "zasilacz ma być markowy i realnie adekwatny do klasy GPU",
      motherboardNote: "nie schodź do totalnie biednej płyty, jeśli ogranicza sensowny upgrade CPU",
      caseNote: "przewiewna, prosta obudowa wystarczy",
    },
    pricingNotes: ["RTX 3060 to bardzo solidny bazowy target w tej kasie", "nie dokładaj 32 GB RAM kosztem spadku klasy GPU"],
    goodExamples: ["Ryzen 5 5600 + RTX 3060", "Intel Core i5-12400F + RX 6700 XT"],
    badExamples: ["Ryzen 7 + RTX 2060 w tym budżecie", "droga platforma i słaba karta"],
    llmInstructions: ["dla gamingu zachowaj GPU-first logic", "jeśli 16 GB daje lepszą kartę, powiedz to wprost"],
  },
  2500: {
    budget: 2500,
    category: "gaming",
    marketPreference: "used",
    realisticRange: { min: 2300, max: 2700 },
    summary: "Bardzo dobry budżet na używany albo mieszany gaming 1080p/1440p value.",
    budgetSplitNote: "GPU nadal ma wygrać, a 5700X jest sensowny tylko wtedy, gdy nie rozwala klasy karty.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["Radeon RX 6700 XT", "RTX 3060 Ti"],
      preferredTier: ["Radeon RX 6700 XT", "RTX 3060 Ti"],
      bannedTier: ["RTX 3060", "RTX 3050", "GTX 1660 Super"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 5600", "Ryzen 5 5600X", "Intel Core i5-12400F"],
      preferredTier: ["Ryzen 7 5700X", "Ryzen 5 5600X", "Intel Core i5-12400F"],
      bannedTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "nie tnij PSU pod mocniejszą używaną kartę",
      motherboardNote: "AM4 i DDR4 są tutaj całkowicie legit jako value path",
      caseNote: "bez drogich obudów, które nic nie dają w fps-ach",
    },
    pricingNotes: ["Ryzen 7 5700X jest sensowną opcją, ale nie kosztem słabszego GPU", "to nadal budżet przede wszystkim gamingowy, nie platformowy"],
    goodExamples: ["Ryzen 5 5600 + RX 6700 XT", "Ryzen 7 5700X + RTX 3060 Ti"],
    badExamples: ["AM5 z dużo słabszym GPU tylko dla nowszej platformy"],
    llmInstructions: ["nie przesadzaj z platformą i chłodzeniem", "w tym budżecie AM4 może być po prostu najlepszym value"],
  },
  3000: {
    budget: 3000,
    category: "gaming",
    marketPreference: "mixed",
    realisticRange: { min: 2800, max: 3300 },
    summary: "Sweet spot, gdzie nowe i used mogą mieć dwie różne, ale obie sensowne strategie.",
    budgetSplitNote: "Większość budżetu w gamingu ma iść w GPU, a nie w obudowę, AIO i dopieszczanie platformy ponad sens.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["Intel Arc B570", "Intel Arc B580", "RTX 5060", "RTX 3060", "Radeon RX 6700 XT"],
      preferredTier: ["Intel Arc B580", "RTX 5060", "RTX 3080", "Radeon RX 6800 XT", "Radeon RX 7700 XT"],
      bannedTier: ["GTX 1660 Super", "RTX 2060", "RTX 3050"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
      preferredTier: ["Ryzen 5 5600X", "Ryzen 7 5700X", "Intel Core i5-12400F"],
      bannedTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "minimum markowy PSU i bez oszczędzania poniżej sensu",
      motherboardNote: "AM4 i DDR4 są legalne, byle platforma nie była trupem bez sensownej płyty",
      caseNote: "airflow ważniejszy niż wygląd",
    },
    pricingNotes: ["na nowych częściach da się zrobić bezpieczny build, ale used często wygrywa bardzo mocno klasą GPU", "16 vs 32 GB to często decyzja preferencyjna"],
    goodExamples: ["Ryzen 5 5600 + Arc B580", "Ryzen 7 5700X + RTX 3080", "Intel Core i5-12400F + RX 6800 XT"],
    badExamples: ["droga platforma i RTX 3050", "32 GB RAM kosztem przeskoku o klasę niżej na GPU"],
    llmInstructions: ["jeśli used wyraźnie wygrywa, nazwij to wprost", "nie udawaj, że słaby full-new build jest lepszy od dużo mocniejszego mixed"],
  },
  3500: {
    budget: 3500,
    category: "gaming",
    marketPreference: "mixed",
    realisticRange: { min: 3300, max: 3800 },
    summary: "Budżet, w którym nowe i używane bardzo mocno zależą od tolerancji na ryzyko i od klasy GPU.",
    budgetSplitNote: "Nie wolno przepalić budżetu na nowszą platformę, jeśli odbiera to klasę GPU.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["Radeon RX 9060 XT 8 GB", "Radeon RX 9060 XT 16 GB", "RTX 5060", "Intel Arc B580"],
      preferredTier: ["Radeon RX 9060 XT 16 GB", "Radeon RX 7700 XT", "Radeon RX 6800 XT", "RTX 5060"],
      bannedTier: ["RTX 3060", "RTX 2060", "GTX 1660 Super"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 5600X", "Ryzen 7 5700X", "Intel Core i5-12400F"],
      preferredTier: ["Ryzen 7 5700X", "Intel Core i5-12400F", "Ryzen 5 7500F"],
      bannedTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "zasilacz ma trzymać poziom pod mocniejsze używane GPU",
      motherboardNote: "platforma ma być rozsądna, ale nie ważniejsza od klasy karty",
      caseNote: "bez przepłacania za szkło i RGB",
    },
    pricingNotes: ["to już bardzo zależy od tego, czy użytkownik akceptuje used", "32 GB może mieć sens, ale nie jako automatyczny przymus"],
    goodExamples: ["Ryzen 7 5700X + RX 6800 XT", "Intel Core i5-12400F + RTX 5060"],
    badExamples: ["Ryzen 5 7500F + wyraźnie słabsze GPU tylko po to, żeby było AM5"],
    llmInstructions: ["pokaż trade-off między nową platformą a klasą GPU", "jeśli używka daje wyraźnie wyższy tier, nie chowaj tego"],
  },
  4000: {
    budget: 4000,
    category: "gaming",
    marketPreference: "used",
    realisticRange: { min: 3800, max: 4300 },
    summary: "Budżet, który przy used albo mixed trzeba oceniać mocno po polsku, nie według samych nowych sklepowych cen.",
    budgetSplitNote: "Tu nadal bronisz klasy GPU, a AM5 jest dodatkiem tylko wtedy, gdy nie osłabia karty.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 5060 Ti", "Radeon RX 9060 XT 16 GB"],
      preferredTier: ["RTX 4070 Super", "RTX 4070 Ti", "Radeon RX 6800 XT", "Radeon RX 7700 XT"],
      bannedTier: ["RTX 4060", "RTX 3060", "RTX 3050", "GTX 1660 Super"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 5600X", "Ryzen 7 5700X", "Intel Core i5-12400F", "Intel Core i5-12600K"],
      preferredTier: ["Ryzen 7 5700X", "Intel Core i5-12600K", "Ryzen 5 7500F"],
      bannedTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "pod używany high-end GPU nie schodź poniżej sensownego markowego 750 W, jeśli pobór tego wymaga",
      motherboardNote: "Ryzen 5 7500F jest legalny, ale nie jako automatyczny default, jeśli AM5 szkodzi value",
      caseNote: "bez kosztownego case'u i chłodzenia kosztem GPU",
    },
    pricingNotes: ["to budżet, który bardzo zyskuje na OLX-aware logice", "RTX 4080 i podobne poziomy nie są normalnym targetem przy 4000 zł used"],
    goodExamples: ["Ryzen 7 5700X + RTX 4070 Super", "Intel Core i5-12600K + RX 6800 XT"],
    badExamples: ["Ryzen 5 7500F + RTX 4060", "za dużo pieniędzy w AM5 i za mało w GPU"],
    llmInstructions: ["nie oceniaj tego budżetu samym full-new mindsetem", "jeśli used daje dużo lepsze GPU, powiedz to wprost"],
  },
  4500: {
    budget: 4500,
    category: "gaming",
    marketPreference: "mixed",
    realisticRange: { min: 4300, max: 4900 },
    summary: "Środek między agresywnym value a coraz sensowniejszą nową platformą.",
    budgetSplitNote: "AM5 ma sens tylko wtedy, gdy nie zabiera istotnie klasy GPU; w przeciwnym razie AM4 albo DDR4 nadal mogą wygrać.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 4070 Super", "RTX 4070 Ti", "Radeon RX 7800 XT", "Radeon RX 6800 XT"],
      preferredTier: ["RTX 4070 Ti", "Radeon RX 7800 XT", "Radeon RX 6800 XT"],
      bannedTier: ["RTX 5060", "RTX 4060", "Arc B580"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 5700X", "Intel Core i5-12400F", "Intel Core i5-12600K", "Ryzen 5 7500F"],
      preferredTier: ["Ryzen 7 5700X", "Intel Core i5-12600K", "Ryzen 5 7500F"],
      bannedTier: ["Ryzen 5 5600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "pod karty klasy 4070 Super albo 7800 XT pilnuj sensownego PSU i jakości platformy",
      motherboardNote: "AM4 i DDR4 nadal mogą być najlepszą drogą, jeśli dają wyraźnie lepsze GPU",
      caseNote: "obudowa ma być rozsądna, nie premium",
    },
    pricingNotes: ["7500F używaj głównie wtedy, gdy AM5 nie osłabia znacząco GPU", "tutaj różnica między sensem platformy a sensem FPS jest bardzo ważna"],
    goodExamples: ["Ryzen 7 5700X + RTX 4070 Super", "Ryzen 5 7500F + RX 7800 XT"],
    badExamples: ["za droga platforma z GPU o klasę niżej"],
    llmInstructions: ["przy małych różnicach możesz preferować AM5", "przy dużych różnicach FPS bronisz mocniejszego GPU"],
  },
  5000: {
    budget: 5000,
    category: "gaming",
    marketPreference: "mixed",
    realisticRange: { min: 4800, max: 5400 },
    summary: "Budżet, w którym DDR4 nadal bywa najlepszym value path, jeśli daje wyraźnie lepsze GPU.",
    budgetSplitNote: "Nadal najpierw bronisz klasy GPU, a RAM i platformę traktujesz jako decyzję value, nie automatyczny premium upgrade.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 5060 Ti", "Radeon RX 9060 XT 16 GB"],
      preferredTier: ["Radeon RX 9070", "RTX 5070", "RTX 5060 Ti", "Radeon RX 9060 XT 16 GB"],
      bannedTier: ["RTX 4060", "RTX 3060", "Arc B570"],
    },
    cpuRules: {
      minimumTier: ["Intel Core i5-12400F", "Intel Core i5-13400F", "Intel Core i5-14400F", "Ryzen 5 7500F"],
      preferredTier: ["Ryzen 5 7500F", "Intel Core i5-14400F", "Intel Core i5-13400F"],
      bannedTier: ["Ryzen 5 5600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "PSU ma być adekwatny do klasy GPU, nie budżetowo przypadkowy",
      motherboardNote: "DDR4 jest nadal sensowne, jeśli daje lepszy total build",
      caseNote: "nie przepłacaj za estetykę kosztem GPU albo CPU",
    },
    pricingNotes: ["RTX 5070 i RX 9070 są agresywnymi targetami value, nie zawsze bezpiecznym defaultem", "16 vs 32 GB nadal może zależeć od priorytetów użytkownika"],
    goodExamples: ["Intel Core i5-14400F + RTX 5070", "Ryzen 5 7500F + RX 9060 XT 16 GB"],
    badExamples: ["AM5 z dużo słabszą kartą tylko dla lepszego upgrade path"],
    llmInstructions: ["jeśli użytkownik chce maks fps, bronisz GPU over luxury", "nie udawaj, że 32 GB zawsze jest obowiązkowe w tym budżecie"],
  },
  6000: {
    budget: 6000,
    category: "gaming",
    marketPreference: "mixed",
    realisticRange: { min: 5700, max: 6500 },
    summary: "Wyższy gamingowy budżet, gdzie słaby midrange GPU przestaje być akceptowalny.",
    budgetSplitNote: "Tu nadal liczy się mocne GPU, ale platforma, PSU i ogólna jakość muszą już wyglądać porządnie.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 5070", "Radeon RX 9070"],
      preferredTier: ["RTX 5070", "Radeon RX 9070"],
      bannedTier: ["RTX 4060", "RTX 5060", "Arc B580"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 7500F", "Ryzen 7 7700", "Intel Core i5-14400F"],
      preferredTier: ["Ryzen 7 7700", "Ryzen 7 7800X3D", "Ryzen 5 7500F"],
      bannedTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 1000,
      psuNote: "markowy PSU adekwatny do klasy GPU jest obowiązkowy",
      motherboardNote: "AM5 zaczyna być tu dużo łatwiejsze do obrony, ale dalej nie ponad GPU",
      coolingNote: "nie wciskaj drogiego AIO, jeśli nie niesie realnej korzyści",
      caseNote: "airflow i sens są ważniejsze niż premium wygląd",
    },
    pricingNotes: ["7800X3D jest możliwy, ale nie powinien być ślepym defaultem", "nie polecaj słabych midrange GPU za 6000 zł gaming"],
    goodExamples: ["Ryzen 5 7500F + RTX 5070", "Ryzen 7 7700 + RX 9070"],
    badExamples: ["Ryzen 7 7800X3D + za słabe GPU", "RTX 4060 w buildzie za 6000 zł"],
    llmInstructions: ["dla 6000 zł gaming nie schodź do słabych GPU", "jeśli 7800X3D niszczy balans, powiedz to wprost"],
  },
  7000: {
    budget: 7000,
    category: "gaming",
    marketPreference: "new",
    realisticRange: { min: 6700, max: 7600 },
    summary: "Budżet, w którym AM5 robi się naturalne, a 32 GB RAM przestaje być luksusem.",
    budgetSplitNote: "Mocne GPU nadal jest centrum builda, ale można już bez bólu złożyć porządny AM5.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["Radeon RX 9070 XT", "RTX 5070"],
      preferredTier: ["Radeon RX 9070 XT", "RTX 5070"],
      bannedTier: ["RTX 5060 Ti", "Radeon RX 9060 XT 16 GB"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 7600", "Ryzen 7 7700"],
      preferredTier: ["Ryzen 7 7700", "Ryzen 5 7600"],
      bannedTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 1000,
      psuNote: "PSU i chłodzenie muszą być adekwatne do mocnego GPU, ale dalej bez przesady",
      motherboardNote: "AM5 jest tu sensowne, ale nadal nie przepalaj na płytę ponad rozsądek",
      coolingNote: "dobre chłodzenie tak, ale bez kultu AIO",
      caseNote: "przewiewna i sensowna obudowa, nie showpiece",
    },
    pricingNotes: ["AM5 dużo łatwiej obronić niż w niższych budżetach", "32 GB jest tu naturalniejsze niż przy 3000-5000 zł"],
    goodExamples: ["Ryzen 5 7600 + RTX 5070", "Ryzen 7 7700 + RX 9070 XT"],
    badExamples: ["zbyt mocny CPU i GPU o klasę niżej"],
    llmInstructions: ["jeśli build jest bliski, możesz preferować lepszy upgrade path", "dalej pilnuj ogólnego balansu"],
  },
  8000: {
    budget: 8000,
    category: "gaming",
    marketPreference: "new",
    realisticRange: { min: 7600, max: 8700 },
    summary: "Wyższy budżet gamingowy, gdzie 5070 Ti lub 9070 XT stają się realnym targetem, ale nadal trzeba pilnować balansu.",
    budgetSplitNote: "Nawet tutaj nie pompuj bez sensu CPU ponad klasę GPU, jeśli całość przez to przestaje się kleić.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 5070 Ti", "Radeon RX 9070 XT"],
      preferredTier: ["RTX 5070 Ti", "Radeon RX 9070 XT"],
      bannedTier: ["RTX 5070", "Radeon RX 9070"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7700", "Ryzen 7 7800X3D"],
      preferredTier: ["Ryzen 7 7800X3D", "Ryzen 7 9800X3D", "Ryzen 7 7700"],
      bannedTier: ["Ryzen 5 7500F", "Intel Core i5-12400F"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 1000,
      psuNote: "pod karty tej klasy nie schodź do tanich kompromisów na PSU",
      motherboardNote: "platforma ma być dobra, ale nie absurdalnie droga względem reszty builda",
      coolingNote: "top-end CPU jest tylko wtedy, gdy cały build nadal ma sens",
      caseNote: "premium może być, ale nie kosztem sensu głównych części",
    },
    pricingNotes: ["9800X3D jest stretch, nie obowiązkowy default", "top-end CPU nie może rozwalić całej proporcji budżetu"],
    goodExamples: ["Ryzen 7 7700 + RTX 5070 Ti", "Ryzen 7 7800X3D + RX 9070 XT"],
    badExamples: ["9800X3D i karta o klasę niżej bez dobrego powodu"],
    llmInstructions: ["pilnuj spójnego high-end balance", "nie wybieraj części tylko dlatego, że są najnowsze"],
  },
};

export const usedGamingGuidelines: BudgetGuideline[] = [
  {
    budget: 2000,
    category: "gaming",
    marketPreference: "used",
    realisticRange: {
      min: 1800,
      max: 2200,
    },
    summary:
      "Tani used gaming z naciskiem na możliwie mocne GPU i sensowną resztę. To nie jest budżet na bajery, tylko na realny fps za złotówkę.",
    budgetSplitNote:
      "W tym progu główny sens ma możliwie mocna karta przy rozsądnej platformie B450, 16 GB RAM i 1 TB SSD, a nie droga obudowa czy chłodzenie.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["Radeon RX 6650 XT", "Radeon RX 6700", "GeForce RTX 3060 Ti"],
      preferredTier: ["Radeon RX 6700", "Radeon RX 6650 XT", "GeForce RTX 3060 Ti"],
      acceptableTier: ["GeForce RTX 2080 SUPER", "Intel Arc A770"],
      bannedTier: [
        "GeForce GTX 1660 SUPER",
        "GeForce RTX 2060 przy wysokiej cenie",
        "8 GB RAM",
        "512 GB SSD jako domyślny standard",
        "no-name PSU",
      ],
    },
    cpuRules: {
      minimumTier: ["AMD Ryzen 5 5600", "AMD Ryzen 5 5600X"],
      preferredTier: ["AMD Ryzen 5 5600", "AMD Ryzen 5 5600X"],
      bannedTier: ["AMD Ryzen 5 3600", "za słaby CPU względem klasy GPU"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "markowy PSU 550-650W minimum, bez no-name zasilaczy",
      motherboardNote: "B450 jest okej, jeśli płyta jest sprawna i nie jest totalnym trupem",
      caseNote: "obudowa ma być przewiewna i tania, nie pokazowa",
    },
    pricingNotes: [
      "duży wpływ na cenę mają SSD, PSU i stan używanych części",
      "największe znaczenie dla opłacalności ma GPU",
    ],
    goodExamples: [
      "Ryzen 5 5600 + RX 6700 + 16 GB + 1 TB SSD",
      "Ryzen 5 5600X + RTX 3060 Ti + 16 GB + 1 TB SSD",
    ],
    badExamples: [
      "Ryzen 5 3600 + GTX 1660 Super za okolice 2000+",
      "8 GB RAM",
      "512 GB SSD jako standard",
      "brak modelu PSU",
    ],
    llmInstructions: [
      "traktuj RX 6700, RX 6650 XT i RTX 3060 Ti jako główne cele",
      "nie pokazuj użytkownikowi nazwy wewnętrznego benchmarku",
      "pisz naturalnie po polsku",
    ],
  },
  {
    budget: 3000,
    category: "gaming",
    marketPreference: "used",
    realisticRange: {
      min: 2800,
      max: 3300,
    },
    summary:
      "Used gaming za 3000 zł ma dawać wyraźny skok względem progu 2000 zł. Jeśli nie ma mocniejszego GPU i sensownej reszty, to value się nie broni.",
    budgetSplitNote:
      "W tym progu GPU musi już robić wyraźny przeskok względem 2000 zł used, a 32 GB RAM jest mile widziane, jeśli nie psuje opłacalności całego koszyka.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["Radeon RX 6700 XT", "GeForce RTX 4060 Ti", "Intel Arc B570"],
      preferredTier: ["Radeon RX 6800 XT", "Radeon RX 7700 XT", "GeForce RTX 5060", "Intel Arc B580"],
      acceptableTier: ["Radeon RX 6700 XT", "GeForce RTX 4060 Ti", "Intel Arc B570"],
      bannedTier: [
        "GeForce GTX 1660 SUPER",
        "GeForce RTX 2060",
        "GeForce RTX 3050",
        "droga obudowa i słaby GPU",
        "lekko ulepszony próg 2000 zł",
        "16 GB jako maksimum przy cenie, która powinna dawać więcej",
      ],
    },
    cpuRules: {
      minimumTier: ["AMD Ryzen 5 5600", "AMD Ryzen 5 5600X", "AMD Ryzen 7 5700X"],
      preferredTier: ["AMD Ryzen 7 5700X", "AMD Ryzen 5 5600X", "AMD Ryzen 5 5600"],
      bannedTier: ["AMD Ryzen 5 3600", "za słaby CPU dla tej klasy GPU"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "markowy PSU jest tutaj standardem, nie dodatkiem",
      motherboardNote: "B450 dalej jest okej, byle platforma była sensowna i stabilna",
      caseNote: "nie przykrywaj słabego GPU drogą budą i chłodzeniem",
    },
    pricingNotes: [
      "cena może się różnić przez SSD, obudowę, chłodzenie i klasę PSU",
      "największe znaczenie nadal ma GPU",
      "32 GB RAM jest mile widziane, jeśli nie psuje value",
    ],
    goodExamples: [
      "Ryzen 7 5700X + RX 6800 XT + 32 GB + 1 TB SSD",
      "Ryzen 5 5600 + RX 7700 XT + 16/32 GB + 1 TB SSD",
      "Ryzen 5 5600X + RTX 5060 + 16/32 GB + 1 TB SSD",
    ],
    badExamples: [
      "Ryzen 5 3600 + GTX 1660 Super",
      "RTX 3050 buildy",
      "RTX 2060 buildy",
      "słabe GPU przykryte drogą obudową i chłodzeniem",
      "brak wyraźnego skoku względem progu 2000",
    ],
    llmInstructions: [
      "traktuj RX 6800 XT, RX 7700 XT, RTX 5060 i Arc B580 jako główne targety",
      "RX 6700 XT i RTX 4060 Ti traktuj bardziej warunkowo, zależnie od ceny",
      "jeśli build wygląda za słabo względem budżetu, oceniaj go surowo",
      "nie pokazuj userowi nazw presetów ani benchmarków",
    ],
  },
];

const usedGamingOverrides: Record<string, BudgetGuideline> = Object.fromEntries(
  usedGamingGuidelines.map((guideline) => [`${guideline.category}:${guideline.budget}:${guideline.marketPreference}`, guideline]),
) as Record<string, BudgetGuideline>;

export const highEndGamingGuidelines: BudgetGuideline[] = [
  {
    budget: 7500,
    category: "gaming",
    marketPreference: "new",
    realisticRange: {
      min: 7200,
      max: 7900,
    },
    summary:
      "Mocny gaming pod 1440p i sensowny start w 4K. Nadal liczy się value, więc nie przepalaj budżetu na dodatki kosztem GPU.",
    budgetSplitNote: "W tym budżecie większość sensu nadal ma siedzieć w GPU i ogólnym balansie, nie w premium dodatkach.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RTX 5070", "RX 9070"],
      preferredTier: ["RX 9070 XT", "RTX 5070"],
      bannedTier: ["RTX 4060", "RTX 5060 8GB", "słabe midrange GPU przy drogich dodatkach"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 7500F", "Ryzen 7 7700"],
      preferredTier: ["Ryzen 7 7700", "Ryzen 5 7500F"],
      bannedTier: ["zbyt drogi CPU kosztem GPU"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 1000,
      psuNote: "markowy PSU adekwatny do klasy GPU",
      motherboardNote: "sensowna AM5 bez przepłacania za premium chipset",
      coolingNote: "nie przepłacaj za AIO, jeśli ucina to budżet GPU",
      caseNote: "dobry airflow, bez płacenia premium tylko za wygląd",
    },
    pricingNotes: [
      "w tym budżecie największe znaczenie nadal ma GPU",
      "na cenę wpływają SSD, obudowa i chłodzenie",
      "32 GB DDR5 to normalny standard, nie luksus",
    ],
    goodExamples: ["Ryzen 7 7700 + RX 9070 XT + 32GB DDR5", "Ryzen 5 7500F + RTX 5070 + 32GB DDR5"],
    badExamples: [
      "RTX 4060 w zestawie za 7500 zł",
      "mocno przepalone chłodzenie i obudowa przy słabym GPU",
      "16 GB RAM w buildzie tej klasy",
    ],
    llmInstructions: [
      "priorytetem jest GPU i realna wydajność w grach",
      "nie schodź poniżej floor GPU dla tego budżetu",
      "jeśli build ma słabe GPU i drogie dodatki, oceniaj go surowo",
    ],
  },
  {
    budget: 8000,
    category: "gaming",
    marketPreference: "new",
    realisticRange: {
      min: 7700,
      max: 8400,
    },
    summary:
      "Bardzo mocny gaming 1440p i sensowne wejście w 4K. Tu 7800X3D zaczyna mieć sens, ale nie kosztem zejścia z GPU.",
    budgetSplitNote: "7800X3D ma sens dopiero wtedy, gdy GPU nadal broni się jako high-endowy wybór w tej kwocie.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RX 9070 XT", "RTX 5070"],
      preferredTier: ["RX 9070 XT", "RTX 5070 Ti"],
      bannedTier: ["RTX 4060", "RTX 5060 8GB", "za słabe GPU względem budżetu"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7700"],
      preferredTier: ["Ryzen 7 7800X3D", "Ryzen 7 7700"],
      bannedTier: ["zbyt drogi CPU przy zejściu z GPU"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 1000,
      psuNote: "markowy 750W lub lepszy, zależnie od GPU",
      motherboardNote: "porządna AM5, ale bez marnowania budżetu",
      coolingNote: "chłodzenie ma być sensowne, nie pokazowe",
      caseNote: "dobry airflow i sensowna kultura pracy",
    },
    pricingNotes: [
      "w tym budżecie 32 GB DDR5 to standard",
      "1 TB jest akceptowalne, ale 2 TB zaczyna mieć sens",
      "największy wpływ na opłacalność nadal ma GPU",
    ],
    goodExamples: ["Ryzen 7 7800X3D + RX 9070 XT + 32GB DDR5", "Ryzen 7 7700 + RX 9070 XT + 32GB DDR5"],
    badExamples: ["7800X3D + RTX 4060", "premium płyta i AIO przy za słabym GPU", "16 GB RAM"],
    llmInstructions: [
      "7800X3D ma sens tylko wtedy, gdy GPU nadal broni się w tej kwocie",
      "nie przepalaj budżetu na dodatki kosztem wydajności w grach",
    ],
  },
  {
    budget: 8500,
    category: "gaming",
    marketPreference: "new",
    realisticRange: {
      min: 8200,
      max: 8900,
    },
    summary:
      "High-end 1440p i bardzo sensowne 4K. Build powinien już wyglądać jak realny high-end, nie jak midrange z drogą obudową.",
    budgetSplitNote: "To ma już wyglądać jak prawdziwy high-end, więc wszystkie dodatki są wtórne wobec klasy GPU i sensownego CPU.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RX 9070 XT"],
      preferredTier: ["RX 9070 XT", "RTX 5070 Ti"],
      bannedTier: ["RTX 5070 jeśli reszta zestawu przepala budżet", "każde GPU poniżej tego tieru bez mocnego uzasadnienia"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7700"],
      preferredTier: ["Ryzen 7 7800X3D"],
      bannedTier: ["za słaby CPU dla high-endu", "przepalony CPU kosztem GPU"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 2000,
      psuNote: "markowy 750-850W zależnie od GPU",
      motherboardNote: "AM5 z sensownym VRM i bez premium przesady",
      coolingNote: "dobre chłodzenie, ale bez show-off build tax",
      caseNote: "airflow i jakość wykonania ważniejsze niż wygląd",
    },
    pricingNotes: [
      "przy tym budżecie 2 TB SSD zaczyna być naturalne",
      "margines ceny może wynikać z obudowy, chłodzenia i SSD",
    ],
    goodExamples: [
      "Ryzen 7 7800X3D + RX 9070 XT + 32GB DDR5 + 2TB SSD",
      "Ryzen 7 7800X3D + RTX 5070 Ti + 32GB DDR5",
    ],
    badExamples: ["1 TB SSD + słabe GPU + drogie dodatki", "16 GB RAM", "midrange GPU w buildzie za 8500 zł"],
    llmInstructions: ["to ma być build wyraźnie high-endowy", "oceniaj surowo każdą próbę przepalenia budżetu poza GPU"],
  },
  {
    budget: 9000,
    category: "gaming",
    marketPreference: "new",
    realisticRange: {
      min: 8700,
      max: 9400,
    },
    summary: "High-end gaming bez głupot. Zestaw powinien być mocny zarówno na papierze, jak i realnie w grach.",
    budgetSplitNote: "To już budżet na kompletny, mocny build, więc GPU ma być wyraźnie high-endowe i nieprzykrywane dodatkami.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RX 9070 XT"],
      preferredTier: ["RX 9070 XT", "RTX 5070 Ti"],
      bannedTier: ["RTX 5070 bez bardzo mocnego uzasadnienia cenowego", "GPU ze zbyt niskiego tieru względem budżetu"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7700"],
      preferredTier: ["Ryzen 7 7800X3D"],
      bannedTier: ["CPU entry-level kosztem pozornej oszczędności"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 2000,
      psuNote: "markowy PSU 750-850W",
      motherboardNote: "AM5 bez marnowania budżetu na zbędny premium tier",
      coolingNote: "dobre chłodzenie pod kulturę pracy i stabilność",
      caseNote: "porządna buda z airflow, nie tylko estetyka",
    },
    pricingNotes: [
      "w tym budżecie build ma być kompletny, nie tylko oparty o drogie CPU",
      "większy SSD i lepsza obudowa mogą podbić cenę, ale nie powinny zjadać GPU",
    ],
    goodExamples: ["7800X3D + RX 9070 XT + 32GB DDR5 + 2TB SSD", "7800X3D + RTX 5070 Ti + 32GB DDR5"],
    badExamples: ["7800X3D + RTX 4060", "bardzo droga płyta i AIO przy zbyt słabym GPU"],
    llmInstructions: [
      "w tym budżecie użytkownik kupuje realny high-end, nie build udający high-end",
      "jeśli GPU nie broni się względem budżetu, uznaj build za słaby",
    ],
  },
  {
    budget: 9500,
    category: "gaming",
    marketPreference: "new",
    realisticRange: {
      min: 9200,
      max: 9900,
    },
    summary: "Prawie topka. Tu 7800X3D + mocne GPU powinno być już naturalnym punktem odniesienia.",
    budgetSplitNote: "Przy tym budżecie 7800X3D i mocne GPU powinny być naturalnym benchmarkiem, ale nadal bez overkillu poza rdzeniem builda.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RX 9070 XT"],
      preferredTier: ["RX 9070 XT", "RTX 5070 Ti"],
      bannedTier: ["każde GPU poniżej high-end floor", "słabe GPU przykryte drogimi dodatkami"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7800X3D"],
      preferredTier: ["Ryzen 7 7800X3D"],
      bannedTier: ["CPU niższego tieru bez bardzo mocnego uzasadnienia"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 2000,
      psuNote: "markowy 750-850W z zapasem pod GPU",
      motherboardNote: "sensowna AM5, nie overkill",
      coolingNote: "stabilne chłodzenie pod 7800X3D, bez zbędnego premium tax",
      caseNote: "dobra kultura pracy i airflow",
    },
    pricingNotes: [
      "w tym budżecie 2 TB jest bardzo sensownym standardem",
      "różnice cen wynikają głównie z SSD, chłodzenia i klasy obudowy",
    ],
    goodExamples: ["7800X3D + RX 9070 XT + 32GB DDR5 + 2TB SSD", "7800X3D + RTX 5070 Ti + 32GB DDR5"],
    badExamples: ["16 GB RAM", "1 TB przy buildzie, który udaje full high-end", "4070-class GPU bez bardzo mocnej obrony cenowej"],
    llmInstructions: [
      "traktuj 7800X3D jako bardzo mocny benchmark dla tego budżetu",
      "jeśli build jest wyraźnie słabszy od tego punktu odniesienia, oceniaj go surowo",
    ],
  },
  {
    budget: 10000,
    category: "gaming",
    marketPreference: "new",
    realisticRange: {
      min: 9700,
      max: 10400,
    },
    summary: "High-end bez kompromisów i bez clown buildów. Jeśli GPU jest za słabe, cały zestaw przegrywa.",
    budgetSplitNote: "W tym budżecie nie ma wymówki dla clown buildów z za słabym GPU i zbyt drogimi dodatkami wokół.",
    allocationPriorities: ["gpu-first", "balanced-platform", "avoid-overspending-on-case", "avoid-overspending-on-cooling"],
    gpuRules: {
      minimumTier: ["RX 9070 XT", "RTX 5070 Ti"],
      preferredTier: ["RTX 5070 Ti", "RX 9070 XT"],
      bannedTier: [
        "RTX 4060",
        "RTX 5060 8GB",
        "RTX 5070 bez bardzo mocnego uzasadnienia cenowego",
        "każde wyraźnie za słabe midrange GPU",
      ],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7800X3D"],
      preferredTier: ["Ryzen 7 7800X3D"],
      bannedTier: ["entry lub mid CPU bez mocnego uzasadnienia"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 2000,
      psuNote: "markowy PSU 750-850W adekwatny do GPU",
      motherboardNote: "solidna AM5, bez bezsensownego premium",
      coolingNote: "porządne chłodzenie, ale bez przepalania budżetu",
      caseNote: "wysoka jakość i airflow, ale nadal bez overkillu",
    },
    pricingNotes: [
      "w tym budżecie buda, chłodzenie i SSD mogą zmieniać cenę, ale nie mogą tłumaczyć słabego GPU",
      "32 GB DDR5 to absolutny standard",
    ],
    goodExamples: [
      "7800X3D + RX 9070 XT + 32GB DDR5 + 2TB SSD",
      "7800X3D + RTX 5070 Ti + 32GB DDR5 + 2TB SSD",
    ],
    badExamples: [
      "7500F + RTX 4060 za 10000 zł",
      "bardzo drogie AIO i obudowa przy GPU za niskiego tieru",
      "16 GB RAM w buildzie tej klasy",
    ],
    llmInstructions: [
      "dla 10000 zł i wyżej nie akceptuj clown buildów z za słabym GPU",
      "jeśli build nie dobija do high-end floor, uznaj go za nieopłacalny względem budżetu",
      "benchmark ma być wewnętrzny, nie pokazuj jego nazwy użytkownikowi",
    ],
  },
];

const highEndGamingOverrides: Record<number, BudgetGuideline> = Object.fromEntries(
  highEndGamingGuidelines.map((guideline) => [guideline.budget, guideline]),
) as Record<number, BudgetGuideline>;

const workOverrides: Record<number, BudgetGuideline> = {
  2000: {
    budget: 2000,
    category: "work",
    marketPreference: "new",
    realisticRange: { min: 1800, max: 2200 },
    summary: "Budżet na pracę i naukę, gdzie iGPU jest zwykle sensowniejsze niż wciskanie przypadkowego dedyka.",
    budgetSplitNote: "W takim buildzie ważniejsze są CPU, RAM, SSD i responsywność niż wydawanie kasy na GPU bez potrzeby.",
    allocationPriorities: ["cpu-first", "ram-ssd-first", "quiet-work-balance", "balanced-platform"],
    gpuRules: {
      minimumTier: ["iGPU"],
      preferredTier: ["iGPU"],
      bannedTier: ["mocne dedykowane GPU bez potrzeby workflow"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 5600G", "Ryzen 5 8600G", "Intel Core i5-12400"],
      preferredTier: ["Ryzen 5 8600G", "Intel Core i5-12400", "Ryzen 5 5600G"],
      bannedTier: ["Intel Core i3-10100", "Ryzen 3 3200G"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "stabilny markowy PSU wystarczy, nie trzeba przepalać budżetu",
      motherboardNote: "ma być sensownie wyposażona i bez problemów z rozbudową",
      coolingNote: "kultura pracy ma sens nawet w tanim work buildzie",
      caseNote: "prosta, cicha i praktyczna obudowa jest okej",
    },
    pricingNotes: ["w tym budżecie dedykowane GPU zwykle robi mniej dobrego niż lepszy CPU i SSD"],
    goodExamples: ["Ryzen 5 5600G + 16 GB + 1 TB SSD", "Intel Core i5-12400 + 16 GB + 1 TB SSD"],
    badExamples: ["słaby CPU i przypadkowe dedykowane GPU", "8 GB RAM w nowym work buildzie"],
    llmInstructions: ["dla pracy nie oceniaj wszystkiego przez GPU", "jeśli workflow nie potrzebuje dedyka, powiedz to jasno"],
  },
  3000: {
    budget: 3000,
    category: "work",
    marketPreference: "new",
    realisticRange: { min: 2800, max: 3300 },
    summary: "Build do pracy i nauki ma większy nacisk na CPU, RAM, SSD i kulturę pracy niż na gamingową logikę GPU-first.",
    budgetSplitNote: "W work buildzie ważniejsze są CPU, RAM, SSD i kultura pracy niż przepalanie budżetu na niepotrzebne GPU.",
    allocationPriorities: ["cpu-first", "ram-ssd-first", "quiet-work-balance", "balanced-platform"],
    gpuRules: {
      minimumTier: ["iGPU"],
      preferredTier: ["iGPU", "Intel Arc B580"],
      bannedTier: ["dedykowane GPU bez uzasadnienia workflow"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 8600G", "Ryzen 7 7700", "Intel Core i5-12400"],
      preferredTier: ["Ryzen 5 8600G", "Ryzen 7 7700", "Intel Core i5-12400"],
      bannedTier: ["Intel Core i3-12100", "Ryzen 5 3600"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "stabilny markowy PSU i brak głupich oszczędności na platformie",
      motherboardNote: "rozsądna płyta z miejscem na rozbudowę",
      coolingNote: "cisza i kultura pracy mają znaczenie",
      caseNote: "może być trochę lepsza niż w gamingu, ale nadal bez przepalania",
    },
    pricingNotes: ["duży wpływ na wartość mają RAM, SSD, obudowa i kultura pracy", "Arc B580 ma sens tylko wtedy, gdy workflow naprawdę z niej korzysta"],
    goodExamples: ["Ryzen 5 8600G + 32 GB + 1 TB SSD", "Ryzen 7 7700 + 16 GB + 1 TB SSD"],
    badExamples: ["za mocne GPU przy biurowym albo programistycznym workflow"],
    llmInstructions: ["dla work buildów nie oceniaj przez same fps", "jeśli 32 GB zależy od workflow, zaznacz to"],
  },
  4000: {
    budget: 4000,
    category: "work",
    marketPreference: "new",
    realisticRange: { min: 3800, max: 4300 },
    summary: "Średni budżet na pracę, gdzie CPU, RAM i SSD dalej są ważniejsze niż gamingowe reflexy.",
    budgetSplitNote: "Dedykowane GPU ma sens tylko wtedy, gdy workflow daje mu realną robotę; inaczej CPU i pamięć są ważniejsze.",
    allocationPriorities: ["cpu-first", "ram-ssd-first", "quiet-work-balance", "balanced-platform"],
    gpuRules: {
      minimumTier: ["iGPU"],
      preferredTier: ["Intel Arc B580", "RTX 5060"],
      bannedTier: ["mocne gamingowe GPU bez uzasadnienia workflow"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 5700X", "Ryzen 5 7500F", "Intel Core i5-12400F", "Intel Core i5-12600K"],
      preferredTier: ["Intel Core i5-12600K", "Ryzen 5 7500F", "Ryzen 7 5700X"],
      bannedTier: ["Ryzen 5 3600", "Intel Core i5-10400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "PSU ma być po prostu pewny i markowy",
      motherboardNote: "platforma ma być sensowna i stabilna, bez przepalania na premium płytę",
      coolingNote: "cicha i sensowna kultura pracy nadal ma znaczenie",
      caseNote: "obudowa ma pomagać w ciszy i temperaturach, nie tylko wyglądać",
    },
    pricingNotes: ["dedykowane GPU nadal nie jest obowiązkowe", "jeśli workflow skorzysta z GPU, trzymaj się umiarkowanych kart"],
    goodExamples: ["Intel Core i5-12600K + 32 GB + 1 TB SSD", "Ryzen 5 7500F + Arc B580 dla workflow GPU"],
    badExamples: ["duże gamingowe GPU bez potrzeby pracy"],
    llmInstructions: ["uzasadniaj dedykowane GPU workflowem, nie benchmarkowym odruchem"],
  },
  5000: {
    budget: 5000,
    category: "work",
    marketPreference: "new",
    realisticRange: { min: 4800, max: 5400 },
    summary: "Budżet, w którym można złożyć bardzo sprawny work build z opcjonalnym GPU, jeśli jest realnie potrzebne.",
    budgetSplitNote: "Najpierw sensowny CPU, RAM i SSD; GPU tylko jeśli workflow faktycznie zwróci tę inwestycję.",
    allocationPriorities: ["cpu-first", "ram-ssd-first", "quiet-work-balance", "balanced-platform"],
    gpuRules: {
      minimumTier: ["iGPU"],
      preferredTier: ["Intel Arc B580", "RTX 5060 Ti"],
      bannedTier: ["za mocne gamingowe GPU bez sensu dla workflow"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 5 7500F", "Ryzen 7 7700", "Intel Core i5-13400F", "Intel Core i5-14400F"],
      preferredTier: ["Ryzen 7 7700", "Intel Core i5-14400F", "Ryzen 5 7500F"],
      bannedTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
    },
    minimumStandards: {
      ramGb: 16,
      storageGb: 1000,
      psuNote: "PSU ma być adekwatny do ewentualnego GPU, ale bez przesady",
      motherboardNote: "rozsądna platforma, bez kultu premium feature'ów",
      coolingNote: "cisza i kultura pracy nadal mają znaczenie",
      caseNote: "przewiewna i praktyczna obudowa, nie gamingowy showpiece",
    },
    pricingNotes: ["32 GB może być sensowne, ale zależy od workflow", "RTX 5060 Ti ma sens tylko jeśli praca realnie skorzysta z dedyka"],
    goodExamples: ["Ryzen 7 7700 + 32 GB + 1 TB SSD", "Intel Core i5-14400F + Arc B580 dla workflow GPU"],
    badExamples: ["work build oceniany jak gamingowy fps machine"],
    llmInstructions: ["dla pracy nadal wyżej stawiaj CPU/RAM/SSD niż gamingowy tier GPU"],
  },
  6000: {
    budget: 6000,
    category: "work",
    marketPreference: "new",
    realisticRange: { min: 5700, max: 6500 },
    summary: "Wyższy budżet na pracę, gdzie 32 GB RAM jest już naturalne, a GPU ma sens tylko jako narzędzie workflow.",
    budgetSplitNote: "GPU ma być uzasadnione pracą, nie przyzwyczajeniem z gamingu; CPU, RAM i platforma nadal są rdzeniem builda.",
    allocationPriorities: ["cpu-first", "ram-ssd-first", "quiet-work-balance", "balanced-platform"],
    gpuRules: {
      minimumTier: ["iGPU"],
      preferredTier: ["RTX 5070", "Radeon RX 9070"],
      bannedTier: ["mocne gamingowe GPU bez uzasadnienia workflow"],
    },
    cpuRules: {
      minimumTier: ["Ryzen 7 7700"],
      preferredTier: ["Ryzen 7 7700", "Ryzen 7 7800X3D tylko jeśli workflow tego naprawdę chce"],
      bannedTier: ["Ryzen 5 5600", "Intel Core i5-12400F"],
    },
    minimumStandards: {
      ramGb: 32,
      storageGb: 1000,
      psuNote: "stabilny, markowy PSU z zapasem pod ewentualny GPU path",
      motherboardNote: "platforma ma być trwała i sensowna, ale bez przepłacania dla sportu",
      coolingNote: "cisza i kultura pracy mają znaczenie w codziennym użyciu",
      caseNote: "obudowa ma być praktyczna i przewiewna",
    },
    pricingNotes: ["jeśli workflow nie potrzebuje GPU, nie wciskaj go tylko dlatego, że budżet pozwala", "dla pracy uzasadniaj GPU zadaniami, nie gamingowym odruchem"],
    goodExamples: ["Ryzen 7 7700 + 32 GB + 1 TB SSD", "Ryzen 7 7700 + RTX 5070 tylko dla workflow GPU"],
    badExamples: ["bardzo mocne GPU w buildzie, który robi głównie biuro i kod"],
    llmInstructions: ["uzasadniaj GPU workflowem", "nie oceniaj value work builda przez samą moc karty"],
  },
};

function buildGamingGuidelines() {
  return gamingBudgetSteps.map((budget) => {
    const override = highEndGamingOverrides[budget] ?? gamingOverrides[budget];

    if (override) {
      return override;
    }

    return createTemplateGuideline({
      budget,
      category: "gaming",
      marketPreference: budget <= 2500 ? "used" : budget <= 5000 ? "mixed" : "new",
      realisticRange: budget <= 4000 ? { min: budget - 200, max: budget + 300 } : { min: budget - 300, max: budget + 500 },
      ramGb: budget >= 7000 ? 32 : 16,
      storageGb: budget >= 2000 ? 1000 : 500,
    });
  });
}

function buildWorkGuidelines() {
  return workBudgetSteps.map((budget) => {
    if (workOverrides[budget]) {
      return workOverrides[budget];
    }

    return createTemplateGuideline({
      budget,
      category: "work",
      marketPreference: "new",
      realisticRange: budget <= 4000 ? { min: budget - 200, max: budget + 300 } : { min: budget - 300, max: budget + 500 },
      ramGb: budget >= 6000 ? 32 : 16,
      storageGb: budget >= 2000 ? 1000 : 500,
    });
  });
}

export const valueGuidelines: BudgetGuideline[] = [...buildGamingGuidelines(), ...buildWorkGuidelines()];

function sortByBudgetDistance(a: BudgetGuideline, b: BudgetGuideline, budget: number) {
  const distanceA = Math.abs(a.budget - budget);
  const distanceB = Math.abs(b.budget - budget);
  return distanceA - distanceB;
}

export function inferGuidelineCategory(input: { useCase?: string; title?: string; description?: string }): BuildCategory {
  const text = `${input.useCase ?? ""} ${input.title ?? ""} ${input.description ?? ""}`.toLowerCase();

  if (/(praca|nauka|biuro|office|programowanie|excel|przeglądarka|przegladarka|photoshop|montaż|montaz|video|premiere|blender|render|cad)/i.test(text)) {
    return "work";
  }

  return "gaming";
}

export function inferGuidelineMarketPreference(input: {
  marketMode?: MarketMode;
  title?: string;
  description?: string;
  url?: string;
}) {
  if (input.marketMode) {
    return input.marketMode;
  }

  const text = `${input.title ?? ""} ${input.description ?? ""} ${input.url ?? ""}`.toLowerCase();

  if (/olx|uzywan|używan|uzywki|używki|rynek wtorny|rynek wtórny|drugiej ręki|druga reka|druga ręka/i.test(text)) {
    return "used" as MarketMode;
  }

  if (/mixed|mieszany|nowe i uzywane|nowe i używane/i.test(text)) {
    return "mixed" as MarketMode;
  }

  return "new" as MarketMode;
}

export function getBudgetGuideline(input: {
  budget: number;
  category: BuildCategory;
  marketPreference?: MarketMode;
}) {
  const key = input.marketPreference ? `${input.category}:${input.budget}:${input.marketPreference}` : null;

  if (key && usedGamingOverrides[key]) {
    return usedGamingOverrides[key];
  }

  const matches = valueGuidelines.filter((guideline) => guideline.category === input.category);
  const filtered = input.marketPreference
    ? matches.filter((guideline) => guideline.marketPreference === input.marketPreference)
    : matches;
  const baseList = filtered.length > 0 ? filtered : matches;
  const nearest = baseList.sort((left, right) => sortByBudgetDistance(left, right, input.budget))[0] ?? null;

  if (!nearest) {
    return null;
  }

  if (input.marketPreference && nearest.marketPreference === input.marketPreference && Math.abs(nearest.budget - input.budget) > 1200) {
    return createMarketFallbackGuideline({
      budget: input.budget,
      category: input.category,
      marketPreference: input.marketPreference,
    });
  }

  return nearest;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)(gb|g)\b/g, "$1 gb")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function textMatchesAnyTier(text: string, tiers: string[]) {
  const normalized = normalize(text);
  return tiers.filter(Boolean).some((tier) => {
    const normalizedTier = normalize(tier);
    return normalized.includes(normalizedTier) || normalizedTier.includes(normalized);
  });
}

export function guidelineSummaryForModel(guideline: BudgetGuideline | null) {
  if (!guideline) {
    return null;
  }

  return {
    marketPreference: guideline.marketPreference,
    realisticRange: guideline.realisticRange,
    summary: guideline.summary,
    budgetSplitNote: guideline.budgetSplitNote,
    allocationPriorities: guideline.allocationPriorities,
    gpuRules: guideline.gpuRules,
    cpuRules: guideline.cpuRules,
    minimumStandards: guideline.minimumStandards,
    pricingNotes: guideline.pricingNotes.filter(Boolean),
    goodExamples: guideline.goodExamples.filter(Boolean),
    badExamples: guideline.badExamples.filter(Boolean),
    llmInstructions: guideline.llmInstructions.filter(Boolean),
  };
}
