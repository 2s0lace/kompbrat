export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

export type BuilderPart = {
  type: string;
  name: string;
  condition?: "new" | "used";
};

export type BuilderResponse = {
  summary: string;
  buildName: string;
  forWho: string;
  parts: BuilderPart[];
  notes: string[];
  warnings: string[];
  selectedMode?: "new" | "used" | "mixed";
  actualModeUsed?: "new" | "used" | "mixed" | null;
  feasibleInSelectedMode?: boolean;
  recommendedFallbackMode?: "new" | "used" | "mixed" | null;
  modeMessage?: string;
  warningMessage?: string;
  recommendationMode?: "new" | "used" | "mixed";
  policyReason?: string;
  alternative?: {
    buildName: string;
    recommendationMode: "new" | "used" | "mixed";
    summary: string;
  };
};

export type RecentBuilderQuery = {
  id: string;
  prompt: string;
  createdAt: string;
  buildName?: string;
};
