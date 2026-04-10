import type { BuildCategory, BuildSourceType } from "@/types/build";

type BuildSourceRule = {
  category: BuildCategory;
  segment: string;
  allowedSourceTypes: BuildSourceType[];
  requiredVariants?: BuildSourceType[];
  note: string;
};

export const buildSourceRules: BuildSourceRule[] = [
  {
    category: "work",
    segment: "all",
    allowedSourceTypes: ["new"],
    note: "Buildy do pracy są zawsze przygotowywane jako nowe zestawy.",
  },
  {
    category: "gaming",
    segment: "2000–2500 zł",
    allowedSourceTypes: ["used", "mixed"],
    note: "Gaming 2000–2500 ma działać wyłącznie jako used albo mixed.",
  },
  {
    category: "gaming",
    segment: "3000 zł",
    allowedSourceTypes: ["new", "mixed"],
    requiredVariants: ["new", "mixed"],
    note: "Gaming 3000 musi mieć dwie osobne wersje: new oraz mixed.",
  },
  {
    category: "gaming",
    segment: "powyżej 4000 zł",
    allowedSourceTypes: ["new"],
    note: "Każdy gaming build powyżej 4000 zł ma być new only.",
  },
];

export function getBuildPolicyHint(category: BuildCategory | "all") {
  if (category === "work") {
    return buildSourceRules.find((rule) => rule.category === "work")?.note ?? null;
  }

  if (category === "gaming") {
    return "Struktura pod Gaming jest już gotowa: 2000–2500 jako used/mixed, 3000 w wersjach new i mixed, a segmenty powyżej 4000 zł jako new only.";
  }

  return "Segmenty są projektowane z góry pod konkretne zasady source type, dzięki czemu późniejsze dopisywanie kolejnych buildów nie wymaga zmian w komponentach.";
}
