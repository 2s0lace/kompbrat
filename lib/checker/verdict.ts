import type { CheckerVerdict } from "@/types/checker";

export function getVerdict(input: {
  valueScore: number;
  riskScore: number;
  suspiciouslyLowPrice: boolean;
}) {
  const { valueScore, riskScore, suspiciouslyLowPrice } = input;

  if (valueScore >= 78 && (suspiciouslyLowPrice || riskScore >= 58)) {
    return {
      verdict: "podejrzanie dobra" as CheckerVerdict,
      summary:
        "Na papierze to wygląda jak świetna okazja, ale cena jest tak niska, że od razu włącza się lampka ostrzegawcza. To nie jest zła oferta, tylko oferta wymagająca bardzo twardej weryfikacji.",
      betterAlternative:
        "Jeśli nie chcesz brać ryzyka, szukaj podobnego zestawu trochę drożej, ale od sprzedawcy z lepszą historią, testami i możliwością sprawdzenia sprzętu na żywo.",
    };
  }

  if (valueScore >= 68) {
    return {
      verdict: "dobra okazja" as CheckerVerdict,
      summary:
        "Ta oferta wygląda sensownie. Nadal warto dopytać o stan, temperatury i historię sprzętu, ale relacja ceny do podanych części broni się całkiem dobrze.",
      betterAlternative:
        "Jeśli chcesz iść krok wyżej, szukaj podobnej specyfikacji z jaśniej opisanym PSU, historią sprzętu i lepszym pakietem zdjęć lub testów.",
    };
  }

  if (valueScore >= 45) {
    return {
      verdict: "średnia" as CheckerVerdict,
      summary:
        "Da się to rozważyć, ale oferta nie broni się sama. Tu decyzję trzeba oprzeć na dodatkowych pytaniach, zdjęciach podzespołów i twardych testach.",
      betterAlternative:
        "Lepszą alternatywą będzie zestaw z równie jasnym CPU i GPU, ale z pełniejszą listą części, markowym zasilaczem i mniejszą liczbą znaków zapytania.",
    };
  }

  return {
    verdict: "nieopłacalna" as CheckerVerdict,
    summary:
      "Na ten moment oferta wygląda po prostu słabo. Albo cena nie klei się ze specyfikacją, albo w opisie jest za mało konkretów, żeby to uczciwie obronić.",
    betterAlternative:
      "Szukaj zestawu z pełną specyfikacją, czytelnym modelem GPU i CPU oraz sensowną ceną zamiast dopłacać za chaos albo marketingowy opis.",
  };
}
