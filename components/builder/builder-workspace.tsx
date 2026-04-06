"use client";

import { useEffect, useMemo, useState } from "react";

import type { BuilderResponse, ChatMessage } from "@/types/ai";

import { BuilderChat } from "@/components/builder/builder-chat";
import { BuilderExamples } from "@/components/builder/builder-examples";
import { BuilderForm } from "@/components/builder/builder-form";
import { PartsList } from "@/components/builder/parts-list";
import { RecentQueries } from "@/components/builder/recent-queries";
import { RecommendationCard } from "@/components/builder/recommendation-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Section } from "@/components/layout/section";
import { builderCopy } from "@/content/copy/builder";
import { useRecentBuilds } from "@/hooks/use-recent-builds";
import { BUILDER_BUDGET_LIMIT_MESSAGE, extractBudgetFromText, isBudgetAboveBuilderLimit } from "@/lib/builder/budget-guardrails";
import { readSavedConfig, saveConfig } from "@/lib/storage/saved-config";

const defaultPrompt = "PC do gier za 3000 zł, bez RGB, najlepiej 1080p.";
const builderLoadingSteps = [
  "Czytam brief i wyłapuję budżet oraz zastosowanie.",
  "Sprawdzam sensowne opcje na rynku nowych i używanych części.",
  "Składam koszyki i liczę opłacalność.",
  "Wybieram najlepszy zestaw i szykuję odpowiedź Brata.",
];

export function BuilderWorkspace() {
  const [value, setValue] = useState(defaultPrompt);
  const [selectedMode, setSelectedMode] = useState<"new" | "mixed" | "used">("new");
  const [response, setResponse] = useState<BuilderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const { recentBuilds, addRecentBuild, clearRecentBuilds } = useRecentBuilds();

  useEffect(() => {
    const saved = readSavedConfig();
    if (saved) {
      setValue(saved);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLoadingStep(0);
      return;
    }

    const interval = window.setInterval(() => {
      setLoadingStep((current) => (current < builderLoadingSteps.length - 1 ? current + 1 : current));
    }, 1400);

    return () => window.clearInterval(interval);
  }, [isLoading]);

  const messages = useMemo(() => {
    const chatMessages: ChatMessage[] = [];

    if (lastPrompt) {
      chatMessages.push({
        id: "builder-user",
        role: "user",
        content: lastPrompt,
      });
    }

    if (response?.summary) {
      chatMessages.push({
        id: "builder-assistant",
        role: "assistant",
        content: response.summary,
      });
    }

    return chatMessages;
  }, [lastPrompt, response]);

  function handleSave() {
    saveConfig(value);
  }

  async function handleSubmit() {
    setError(null);
    setWarning(null);
    setIsLoading(true);

    try {
      const prompt = value.trim();
      const detectedBudget = extractBudgetFromText(prompt);

      if (isBudgetAboveBuilderLimit(detectedBudget)) {
        setResponse(null);
        setWarning(BUILDER_BUDGET_LIMIT_MESSAGE);
        return;
      }

      const payload = {
        marketMode: selectedMode,
        messages: [
          {
            id: crypto.randomUUID(),
            role: "user" as const,
            content: prompt,
          },
        ],
      };

      const request = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const payloadResponse = (await request.json().catch(() => null)) as { message?: string; response?: BuilderResponse } | BuilderResponse | null;

      if (!request.ok) {
        const maybeError =
          payloadResponse && typeof payloadResponse === "object" && "message" in payloadResponse
            ? (payloadResponse as { message?: string; response?: BuilderResponse })
            : null;

        if (maybeError?.response) {
          setLastPrompt(prompt);
          setResponse(maybeError.response);
          setWarning(maybeError.message ?? "Nie udało się złożyć sensownego zestawu w wybranym trybie.");
          return;
        }

        throw new Error(maybeError?.message ?? "Nie udało się pobrać rekomendacji. Spróbuj ponownie.");
      }

      const data =
        payloadResponse && typeof payloadResponse === "object" && "summary" in payloadResponse
          ? (payloadResponse as BuilderResponse)
          : null;

      if (!data) {
        throw new Error("Nie udało się odczytać odpowiedzi buildera.");
      }

      setLastPrompt(prompt);
      setResponse(data);
      saveConfig(prompt);
      addRecentBuild({
        id: crypto.randomUUID(),
        prompt,
        createdAt: new Date().toISOString(),
        buildName: data.buildName,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Wystąpił nieznany błąd.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Section
        title="Zacznij od krótkiego briefu"
        description="Na MVP flow jest już prawdziwy: opisujesz potrzeby, a formularz pyta backend o rekomendację."
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <BuilderForm
            value={value}
            selectedMode={selectedMode}
            isPending={isLoading}
            onChange={setValue}
            onModeChange={setSelectedMode}
            onSave={handleSave}
            onSubmit={handleSubmit}
          />
          <div className="space-y-6">
            <BuilderExamples prompts={builderCopy.examplePrompts} onSelectPrompt={setValue} />
            <RecentQueries queries={recentBuilds} onSelectQuery={setValue} onClear={clearRecentBuilds} />
          </div>
        </div>
      </Section>

      <Section
        title="Rekomendacja"
        description="Tutaj trafia ustrukturyzowana odpowiedź AI z `/api/chat`: podsumowanie, części, dla kogo to ma sens i na co uważać."
      >
        {warning ? <ErrorState message={warning} tone="warning" /> : null}
        {error ? <ErrorState message={error} /> : null}

        {!response && !isLoading && !warning ? (
          <EmptyState
            title="Opisz, czego potrzebujesz"
            description="Po wysłaniu briefu pokażemy odpowiedź buildera, propozycję zestawu i przykładową listę części."
          />
        ) : null}

        {isLoading ? (
          <LoadingState
            label="Brat właśnie sprawdza rynek, składa koszyki i liczy, co tu ma najwięcej sensu."
            steps={builderLoadingSteps}
            activeStep={loadingStep}
          />
        ) : null}

        {response && !isLoading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <BuilderChat messages={messages} />
            <div className="space-y-6">
              <RecommendationCard response={response} />
              <PartsList parts={response.parts} />
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
