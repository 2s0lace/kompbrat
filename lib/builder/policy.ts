import type { BuilderMarketMode, BuilderPolicyDecision, ScoredBuildBasket } from "@/lib/builder/types";

function getUsedAdvantageThreshold(budget: number) {
  if (budget <= 3500) {
    return 6;
  }

  if (budget <= 6000) {
    return 10;
  }

  return 14;
}

function getAlternativeThreshold(budget: number) {
  return budget <= 3500 ? 4 : 6;
}

function getMinimumSensibleScore(mode: BuilderMarketMode, budget: number) {
  if (mode === "new") {
    if (budget <= 1600) {
      return 52;
    }

    if (budget <= 2200) {
      return 56;
    }

    if (budget <= 3000) {
      return 54;
    }

    if (budget <= 5000) {
      return 57;
    }

    return 54;
  }

  if (mode === "used") {
    if (budget <= 1600) {
      return 46;
    }

    if (budget <= 2200) {
      return 48;
    }

    if (budget <= 3500) {
      return 52;
    }

    return 55;
  }

  if (budget <= 1600) {
    return 48;
  }

  if (budget <= 2200) {
    return 50;
  }

  if (budget <= 3500) {
    return 53;
  }

  return 56;
}

function pickBestByMode(mode: BuilderMarketMode, baskets: ScoredBuildBasket[], budget: number) {
  const sameMode = baskets.filter((basket) => basket.marketMode === mode);
  const comfortablyWithinBudget = sameMode.filter((basket) => basket.estimatedTotal <= budget);

  if (comfortablyWithinBudget.length > 0) {
    return comfortablyWithinBudget.sort((a, b) => b.score - a.score || a.estimatedTotal - b.estimatedTotal)[0];
  }

  const nearBudget = sameMode.filter((basket) => basket.estimatedTotal <= budget * 1.05);

  if (nearBudget.length > 0) {
    return nearBudget.sort((a, b) => b.score - a.score || a.estimatedTotal - b.estimatedTotal)[0];
  }

  return sameMode.sort((a, b) => b.score - a.score || a.estimatedTotal - b.estimatedTotal)[0];
}

function buildModeScores(input: {
  bestNew?: ScoredBuildBasket;
  bestUsed?: ScoredBuildBasket;
  bestMixed?: ScoredBuildBasket;
}) {
  return {
    new: input.bestNew?.score,
    used: input.bestUsed?.score,
    mixed: input.bestMixed?.score,
  } satisfies Partial<Record<BuilderMarketMode, number>>;
}

function isBasketAvailableForMode(basket: ScoredBuildBasket | undefined, budget: number) {
  if (!basket) {
    return false;
  }

  if (basket.estimatedTotal > budget * 1.12) {
    return false;
  }

  return true;
}

function isCompromiseHeavy(mode: BuilderMarketMode, basket: ScoredBuildBasket | undefined, budget: number) {
  if (!basket) {
    return true;
  }

  return basket.score < getMinimumSensibleScore(mode, budget);
}

function buildSelectedModeMessage(selectedMode: BuilderMarketMode) {
  if (selectedMode === "new") {
    return "Da się złożyć nowy zestaw w tym budżecie, ale będzie to build z kompromisami.";
  }

  if (selectedMode === "used") {
    return "Da się złożyć używany zestaw w tym budżecie, ale sens zależy mocno od stanu części i rozsądnych zakupów.";
  }

  return "Da się złożyć zestaw mieszany w tym budżecie i to zwykle jest najbardziej elastyczny tryb pod value.";
}

function buildModeWarning(selectedMode: BuilderMarketMode) {
  if (selectedMode === "new") {
    return "Used może dawać lepszy stosunek cena/wydajność, ale przy wyborze New trzymam się wyłącznie nowych części.";
  }

  if (selectedMode === "used") {
    return "Ten tryb może wyglądać najlepiej na papierze, ale wymaga dużo rozsądniejszej weryfikacji stanu części.";
  }

  return "Mixed daje największą swobodę, ale warto pilnować które części są nowe, a które używane.";
}

function buildSuccessReason(selectedMode: BuilderMarketMode, budget: number, bestNew?: ScoredBuildBasket, bestUsed?: ScoredBuildBasket, bestMixed?: ScoredBuildBasket) {
  const selectedBasket = selectedMode === "new" ? bestNew : selectedMode === "used" ? bestUsed : bestMixed;
  const compromiseHeavy = isCompromiseHeavy(selectedMode, selectedBasket, budget);

  if (selectedMode === "mixed") {
    return compromiseHeavy
      ? "Mixed dalej ma tutaj sens, ale to bardziej kompromisowy build value niż zestaw bez ustępstw."
      : "W trybie Mixed liczy się najlepszy balans między spokojem nowych części a value z używanego rynku i tutaj ten balans naprawdę się spina.";
  }

  if (selectedMode === "used") {
    return compromiseHeavy
      ? "Da się złożyć używany zestaw w tym budżecie, ale trzeba zaakceptować więcej kompromisów i mocniej pilnować jakości części."
      : "Tryb Used ma tu sens, bo daje realny skok wydajności albo value bez wciskania dziwnego koszyka na siłę.";
  }

  const challenger = [bestMixed, bestUsed].filter((basket): basket is ScoredBuildBasket => Boolean(basket)).sort((a, b) => b.score - a.score)[0];

  if (compromiseHeavy) {
    return challenger
      ? "Da się złożyć nowy zestaw w tym budżecie, ale będzie to build value z kompromisami. Used lub Mixed mogą dawać lepszy stosunek cena/wydajność, jednak przy wyborze New trzymam się nowych części."
      : "Da się złożyć nowy zestaw w tym budżecie, ale będzie to build value z kompromisami i bez premium zapasu na przyszłość.";
  }

  if (challenger && challenger.score >= (bestNew?.score ?? 0) + getAlternativeThreshold(budget)) {
    return "Nowy zestaw dalej jest możliwy i to właśnie jego zwracam, ale warto wiedzieć, że mixed albo używki mogą dać więcej czystej wydajności za tę samą kwotę.";
  }

  return "Wybrany tryb New broni się tutaj produktowo, więc nie było sensu uciekać w używki tylko dla samej idei wyższego value.";
}

export function chooseBasketByPolicy(input: {
  budget: number;
  requestedMode?: BuilderMarketMode;
  scoredBaskets: ScoredBuildBasket[];
}): BuilderPolicyDecision | null {
  const selectedMode = input.requestedMode ?? "new";
  const bestNew = pickBestByMode("new", input.scoredBaskets, input.budget);
  const bestUsed = pickBestByMode("used", input.scoredBaskets, input.budget);
  const bestMixed = pickBestByMode("mixed", input.scoredBaskets, input.budget);
  const modeScores = buildModeScores({ bestNew, bestUsed, bestMixed });
  const basketsByMode: Record<BuilderMarketMode, ScoredBuildBasket | undefined> = {
    new: bestNew,
    used: bestUsed,
    mixed: bestMixed,
  };

  const selectedBasket = basketsByMode[selectedMode];
  const selectedAvailable = isBasketAvailableForMode(selectedBasket, input.budget);

  if (selectedAvailable && selectedBasket) {
    const alternativeBasket =
      selectedMode === "mixed"
        ? [bestNew, bestUsed]
            .filter((basket): basket is ScoredBuildBasket => Boolean(basket))
            .sort((a, b) => b.score - a.score)[0]
        : [bestMixed, selectedMode === "new" ? bestUsed : bestNew]
            .filter((basket): basket is ScoredBuildBasket => Boolean(basket))
            .sort((a, b) => b.score - a.score)[0];

    const selectedCompromiseHeavy = isCompromiseHeavy(selectedMode, selectedBasket, input.budget);

    return {
      status: "success",
      selectedMode,
      actualModeUsed: selectedMode,
      feasibleInSelectedMode: true,
      recommendedFallbackMode: null,
      modeMessage: selectedCompromiseHeavy ? buildSelectedModeMessage(selectedMode) : undefined,
      warningMessage: selectedCompromiseHeavy || alternativeBasket ? buildModeWarning(selectedMode) : undefined,
      recommendedMode: selectedMode,
      recommendedBasket: selectedBasket,
      alternativeBasket,
      policyReason: buildSuccessReason(selectedMode, input.budget, bestNew, bestUsed, bestMixed),
      alternativeReason: alternativeBasket
        ? selectedMode === "new"
          ? "Used albo Mixed mogą dawać lepszy stosunek cena/wydajność, ale przy wyborze New pokazuję najlepszy sensowny zestaw wyłącznie na nowych częściach."
          : selectedMode === "used"
            ? "Jeśli wolisz mniej ryzyka i więcej spokoju, obok masz najbliższą sensowną alternatywę poza used."
            : "Jeśli nie chcesz miksu rynku, obok masz najbliższą sensowną alternatywę w jednym rynku."
        : undefined,
      modeScores,
    };
  }

  return null;
}
