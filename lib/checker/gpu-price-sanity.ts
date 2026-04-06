import { textMatchesAnyTier } from "@/lib/value-guidelines";
import type { GpuValueCheck, ParsedOffer } from "@/types/checker";

type PriceBracketRule = {
  label: string;
  min: number;
  max: number;
  minimumAcceptable: string[];
  tooWeak: string[];
  borderline: string[];
  good: string[];
};

const PRICE_BRACKETS: PriceBracketRule[] = [
  {
    label: "<= 800 zł",
    min: 0,
    max: 800,
    minimumAcceptable: ["GeForce GTX 960", "GeForce GTX 1050 Ti", "Radeon RX 570", "GeForce GTX 1060 3GB"],
    tooWeak: ["GeForce GTX 750 Ti", "GeForce GTX 950", "GeForce GT 1030", "Radeon RX 550", "Radeon RX 560 2GB", "Zintegrowana grafika"],
    borderline: ["GeForce GTX 960", "GeForce GTX 1050 Ti"],
    good: ["Radeon RX 570", "GeForce GTX 1060 3GB", "GeForce GTX 1060 6GB"],
  },
  {
    label: "801-1000 zł",
    min: 801,
    max: 1000,
    minimumAcceptable: ["GeForce GTX 1060 3GB", "GeForce GTX 1060 6GB", "Radeon RX 570", "Radeon RX 580"],
    tooWeak: ["GeForce GTX 960", "GeForce GTX 1050", "GeForce GTX 1050 Ti", "Radeon RX 560", "GeForce GT 1030"],
    borderline: ["GeForce GTX 1060 3GB", "Radeon RX 570 4GB"],
    good: ["GeForce GTX 1060 6GB", "Radeon RX 580 8GB", "GeForce GTX 1650"],
  },
  {
    label: "1001-1200 zł",
    min: 1001,
    max: 1200,
    minimumAcceptable: ["GeForce GTX 1060 6GB", "Radeon RX 580 8GB", "GeForce GTX 1650"],
    tooWeak: ["GeForce GTX 1050 Ti", "GeForce GTX 960", "GeForce GTX 1060 3GB", "Radeon RX 570 4GB"],
    borderline: ["GeForce GTX 1060 6GB", "Radeon RX 580 4GB"],
    good: ["Radeon RX 580 8GB", "GeForce GTX 1650", "GeForce GTX 1650 Super"],
  },
  {
    label: "1201-1400 zł",
    min: 1201,
    max: 1400,
    minimumAcceptable: ["GeForce GTX 1650", "GeForce GTX 1650 Super", "GeForce GTX 1660", "Radeon RX 5500 XT 8GB"],
    tooWeak: ["GeForce GTX 1050 Ti", "GeForce GTX 960", "GeForce GTX 1060 3GB"],
    borderline: ["GeForce GTX 1060 6GB", "Radeon RX 580 8GB", "GeForce GTX 1650"],
    good: ["GeForce GTX 1650 Super", "GeForce GTX 1660", "Radeon RX 5500 XT 8GB"],
  },
  {
    label: "1401-1600 zł",
    min: 1401,
    max: 1600,
    minimumAcceptable: ["GeForce GTX 1660", "GeForce GTX 1650 Super", "GeForce GTX 1660 Super"],
    tooWeak: ["GeForce GTX 1650", "GeForce GTX 1060 6GB", "Radeon RX 580", "GeForce GTX 1050 Ti", "GeForce GTX 960"],
    borderline: ["GeForce GTX 1650 Super", "GeForce GTX 1660"],
    good: ["GeForce GTX 1660 Super", "GeForce GTX 1660 Ti", "Radeon RX 5600 XT"],
  },
  {
    label: "1601-1800 zł",
    min: 1601,
    max: 1800,
    minimumAcceptable: ["GeForce GTX 1660 Super", "GeForce GTX 1660 Ti", "Radeon RX 5600 XT", "GeForce RTX 2060", "Radeon RX 6600"],
    tooWeak: ["GeForce GTX 1660", "GeForce GTX 1650 Super", "GeForce GTX 1650", "GeForce GTX 1060 6GB"],
    borderline: ["GeForce GTX 1660 Super", "GeForce GTX 1660 Ti"],
    good: ["GeForce RTX 2060", "Radeon RX 6600", "Radeon RX 5700", "Radeon RX 5700 XT"],
  },
  {
    label: "1801-2100 zł",
    min: 1801,
    max: 2100,
    minimumAcceptable: ["GeForce RTX 2060", "Radeon RX 6600", "Radeon RX 5700 XT", "GeForce RTX 2060 Super"],
    tooWeak: ["GeForce GTX 1660", "GeForce GTX 1660 Super", "GeForce GTX 1660 Ti"],
    borderline: ["GeForce RTX 2060", "Radeon RX 6600"],
    good: ["GeForce RTX 2060 Super", "GeForce RTX 2070", "Radeon RX 6600 XT", "Radeon RX 6650 XT"],
  },
  {
    label: "2101-2500 zł",
    min: 2101,
    max: 2500,
    minimumAcceptable: ["GeForce RTX 2070", "GeForce RTX 3060", "Radeon RX 6600 XT", "Radeon RX 6650 XT", "Radeon RX 7600"],
    tooWeak: ["GeForce RTX 2060", "Radeon RX 6600", "GeForce GTX 1660 Ti"],
    borderline: ["GeForce RTX 2070", "GeForce RTX 3060 8GB", "Radeon RX 6600 XT"],
    good: ["GeForce RTX 3060 12GB", "Radeon RX 6650 XT", "Radeon RX 7600", "GeForce RTX 2070 Super"],
  },
  {
    label: "2501-3000 zł",
    min: 2501,
    max: 3000,
    minimumAcceptable: ["GeForce RTX 3060 12GB", "Radeon RX 6700 XT", "Radeon RX 7600", "GeForce RTX 4060", "GeForce RTX 3070"],
    tooWeak: ["GeForce RTX 2060", "GeForce RTX 2060 Super", "Radeon RX 6600"],
    borderline: ["GeForce RTX 3060 8GB", "GeForce RTX 3060 12GB", "Radeon RX 7600"],
    good: ["Radeon RX 6700 XT", "GeForce RTX 4060", "GeForce RTX 3070"],
  },
  {
    label: "3001-3500 zł",
    min: 3001,
    max: 3500,
    minimumAcceptable: ["GeForce RTX 3070", "GeForce RTX 4060", "Radeon RX 6700 XT", "Radeon RX 6750 XT", "Radeon RX 7700 XT"],
    tooWeak: ["GeForce RTX 3060", "Radeon RX 6600 XT"],
    borderline: ["GeForce RTX 4060", "GeForce RTX 3070", "Radeon RX 6700 XT"],
    good: ["Radeon RX 6750 XT", "Radeon RX 7700 XT", "GeForce RTX 3070 Ti"],
  },
  {
    label: "3501-4200 zł",
    min: 3501,
    max: 4200,
    minimumAcceptable: ["GeForce RTX 3070 Ti", "GeForce RTX 4060 Ti", "Radeon RX 6800", "Radeon RX 7700 XT", "GeForce RTX 3080"],
    tooWeak: ["GeForce RTX 3060", "GeForce RTX 4060", "Radeon RX 7600"],
    borderline: ["GeForce RTX 4060 Ti", "GeForce RTX 3070 Ti", "Radeon RX 6800"],
    good: ["GeForce RTX 3080", "Radeon RX 6800", "Radeon RX 7800 XT"],
  },
  {
    label: "4201-5000 zł",
    min: 4201,
    max: 5000,
    minimumAcceptable: ["GeForce RTX 3080", "Radeon RX 6800 XT", "GeForce RTX 4070", "Radeon RX 7800 XT"],
    tooWeak: ["GeForce RTX 3070", "GeForce RTX 4060 Ti", "Radeon RX 6700 XT"],
    borderline: ["GeForce RTX 3080", "Radeon RX 6800 XT"],
    good: ["GeForce RTX 4070", "Radeon RX 7800 XT", "GeForce RTX 3080 Ti"],
  },
  {
    label: "> 5000 zł",
    min: 5001,
    max: 20000,
    minimumAcceptable: ["GeForce RTX 4070", "GeForce RTX 4070 SUPER", "Radeon RX 7800 XT", "Radeon RX 7900 GRE"],
    tooWeak: ["GeForce RTX 3070", "GeForce RTX 4060 Ti", "Radeon RX 6700 XT"],
    borderline: ["GeForce RTX 4070", "Radeon RX 7800 XT"],
    good: ["GeForce RTX 4070 SUPER", "Radeon RX 7900 GRE", "GeForce RTX 4080 SUPER", "Radeon RX 9070 XT", "GeForce RTX 5070 Ti"],
  },
];

function getPriceBracket(price: number) {
  return PRICE_BRACKETS.find((bracket) => price >= bracket.min && price <= bracket.max) ?? PRICE_BRACKETS[PRICE_BRACKETS.length - 1];
}

function getDetectedGpu(parsed: ParsedOffer) {
  return parsed.detectedParts.find((part) => part.type === "GPU");
}

function getGpuMatchName(gpu: NonNullable<ReturnType<typeof getDetectedGpu>>) {
  const vramGb = gpu.attributes?.vramGb;
  const normalizedName = gpu.name.trim();

  if (!vramGb || /\b\d+\s?gb\b/i.test(normalizedName)) {
    return normalizedName;
  }

  return `${normalizedName} ${vramGb}GB`;
}

function isDesktopGamingContext(text: string) {
  return /pc|komputer|desktop|stacjonarny|gaming|gta|fortnite|warzone|cs2|valorant/i.test(text);
}

export function buildGpuValueCheck(input: {
  parsed: ParsedOffer;
  title?: string;
  description?: string;
  price?: number;
}): GpuValueCheck | null {
  const effectivePrice = input.price ?? input.parsed.price;
  const rawContext = `${input.title ?? ""} ${input.description ?? ""} ${input.parsed.preprocessed.combined.raw}`;

  if (!effectivePrice || !isDesktopGamingContext(rawContext)) {
    return null;
  }

  const bracket = getPriceBracket(effectivePrice);
  const gpu = getDetectedGpu(input.parsed);

  if (!gpu || gpu.confidence === "low") {
    return {
      gpu_found: gpu?.name ?? "brak dokładnego modelu GPU",
      price_bracket: bracket.label,
      gpu_position_for_price: "too_weak",
      explanation: "Brakuje dokładnego modelu GPU albo parser nie wykrył go pewnie, więc przy używanym gaming PC trzeba założyć najgorszy sensowny scenariusz.",
      redFlags: ["Brakuje dokładnego modelu GPU."],
      notes: ["Przy ofertach gamingowych bez twardego modelu GPU łatwo przepłacić za słaby zestaw."],
    };
  }

  const gpuName = getGpuMatchName(gpu);
  const redFlags: string[] = [];
  const notes: string[] = [];

  if (textMatchesAnyTier(gpuName, bracket.tooWeak)) {
    redFlags.push("GPU wygląda wyraźnie za słabo względem ceny całego używanego PC.");
  }

  if (
    (effectivePrice >= 1400 && textMatchesAnyTier(gpuName, ["GeForce GTX 1060", "Radeon RX 580", "GeForce GTX 1650"])) ||
    (effectivePrice >= 1000 && textMatchesAnyTier(gpuName, ["GeForce GTX 1050 Ti", "GeForce GTX 960", "GeForce GT 1030"])) ||
    (effectivePrice >= 2000 && textMatchesAnyTier(gpuName, ["GeForce GTX 1660", "GeForce GTX 1660 SUPER", "GeForce GTX 1660 Ti"])) ||
    (effectivePrice >= 3000 && textMatchesAnyTier(gpuName, ["GeForce RTX 3060", "GeForce RTX 3060 Ti", "Radeon RX 6600 XT", "Radeon RX 7600"]))
  ) {
    redFlags.push("Cena całego zestawu wygląda za wysoka jak na klasę samego GPU.");
  }

  if (/nvidia geforce\b|gaming graphics|4gb graphics|8gb gpu/i.test(rawContext)) {
    redFlags.push("Sprzedawca ukrywa dokładny model GPU za ogólnikami.");
  }

  if (/rgb|window|szklo|szkło|gaming case|aio|liquid/i.test(rawContext) && textMatchesAnyTier(gpuName, [...bracket.tooWeak, ...bracket.borderline])) {
    notes.push("Droga obudowa, RGB albo chłodzenie nie bronią słabego GPU w tej cenie.");
  }

  let gpu_position_for_price: GpuValueCheck["gpu_position_for_price"] = "ok";
  let explanation = `GPU trzyma sensowny poziom względem progu ${bracket.label} dla używanego gaming PC.`;

  if (textMatchesAnyTier(gpuName, bracket.good)) {
    gpu_position_for_price = "strong";
    explanation = `To jest mocny albo bardzo sensowny GPU jak na próg ${bracket.label} dla używanego desktopa gamingowego.`;
  } else if (textMatchesAnyTier(gpuName, bracket.borderline)) {
    gpu_position_for_price = "borderline";
    explanation = `GPU jeszcze da się obronić w progu ${bracket.label}, ale nie wygląda jak oczywisty deal i reszta zestawu musi naprawdę pomagać.`;
  } else if (textMatchesAnyTier(gpuName, bracket.tooWeak) || !textMatchesAnyTier(gpuName, [...bracket.minimumAcceptable, ...bracket.borderline, ...bracket.good])) {
    gpu_position_for_price = "too_weak";
    explanation = `Jak na próg ${bracket.label} ten GPU wygląda po prostu za słabo dla używanego gaming PC i pachnie przepłaceniem albo próbą przykrycia problemu resztą dodatków.`;
  }

  return {
    gpu_found: gpuName,
    price_bracket: bracket.label,
    gpu_position_for_price,
    explanation,
    redFlags,
    notes,
  };
}
