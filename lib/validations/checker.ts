import { z } from "zod";

export const checkerSchema = z
  .object({
    title: z.string().trim().optional().default(""),
    description: z.string().trim().optional().default(""),
    price: z.coerce.number().nonnegative().optional(),
    url: z.union([z.string().url(), z.literal(""), z.undefined()]),
  })
  .refine((value) => value.title.length >= 3 || value.description.length >= 10, {
    message: "Podaj tytuł albo sensowny opis oferty.",
    path: ["description"],
  });

export const checkerOutputSchema = z.object({
  verdict: z.enum(["dobra okazja", "średnia", "nieopłacalna", "podejrzanie dobra"]),
  score: z.number().min(0).max(100),
  valueScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  profitabilityScore: z.number().min(0).max(100).optional(),
  profitabilityLabel: z.enum(["Bierz", "Negocjuj", "Raczej nie", "Odpuść"]).optional(),
  riskLabel: z.enum(["Niskie", "Średnie", "Wysokie"]).optional(),
  fairValue: z.number().nonnegative().nullable().optional(),
  fairValueRange: z
    .object({
      min: z.number().nonnegative(),
      max: z.number().nonnegative(),
    })
    .nullable()
    .optional(),
  priceRatio: z.number().nonnegative().nullable().optional(),
  subscores: z
    .object({
      priceScore: z.number().min(0).max(100),
      balanceScore: z.number().min(0).max(100),
      confidenceScore: z.number().min(0).max(100),
    })
    .optional(),
  profitabilityBreakdown: z
    .array(
      z.object({
        key: z.string().min(1),
        points: z.number(),
        description: z.string().min(1),
      }),
    )
    .optional(),
  riskBreakdown: z
    .array(
      z.object({
        key: z.string().min(1),
        points: z.number(),
        description: z.string().min(1),
      }),
    )
    .optional(),
  decisionSummary: z
    .object({
      shortVerdict: z.string().min(1),
      maxReasonablePrice: z.number().nonnegative().nullable().optional(),
      keyTakeaways: z.array(z.string().min(1)),
      nextSteps: z.array(z.string().min(1)),
    })
    .optional(),
  verdictLabel: z.enum(["Bierz", "Negocjuj", "Raczej nie", "Odpuść"]).optional(),
  verdictSummary: z.string().min(1).optional(),
  estimatedValueMin: z.number().nonnegative().nullable().optional(),
  estimatedValueMax: z.number().nonnegative().nullable().optional(),
  sensibleBuyPrice: z.number().nonnegative().nullable().optional(),
  insights: z
    .object({
      red_flags: z.array(
        z.object({
          text: z.string().min(1),
          reason_code: z.string().min(1),
        }),
      ),
      minuses: z.array(
        z.object({
          text: z.string().min(1),
          reason_code: z.string().min(1),
        }),
      ),
      to_verify: z.array(
        z.object({
          text: z.string().min(1),
          reason_code: z.string().min(1),
        }),
      ),
      positives: z.array(
        z.object({
          text: z.string().min(1),
          reason_code: z.string().min(1),
        }),
      ),
    })
    .optional(),
  nextSteps: z.array(z.string().min(1)).optional(),
  summary: z.string().min(1),
  detectedParts: z.array(
    z.object({
      type: z.enum(["CPU", "GPU", "RAM", "DYSK", "PŁYTA", "PSU", "CHŁODZENIE", "CENA"]),
      name: z.string().min(1),
      confidence: z.enum(["high", "medium", "low"]),
      source: z.enum(["title", "description", "merged", "explicit"]),
    }),
  ),
  redFlags: z.array(z.string().min(1)),
  betterAlternative: z.string().min(1),
  estimatedMarketValue: z.number().positive().optional(),
  estimatedMarketValueConfidence: z.enum(["high", "medium", "low"]).optional(),
  valuationNote: z.string().min(1).optional(),
  psuAssessment: z
    .object({
      recommendedWattage: z.number().positive().optional(),
      minimumSuggestedWattage: z.number().positive().optional(),
      offeredWattage: z.number().positive().optional(),
      status: z.enum(["ok", "borderline", "too_weak", "unknown"]),
      summary: z.string().min(1),
      warning: z.string().min(1).optional(),
      note: z.string().min(1),
      confidence: z.enum(["high", "medium", "low"]),
    })
    .optional(),
  gpuValueCheck: z
    .object({
      gpu_found: z.string().min(1),
      price_bracket: z.string().min(1),
      gpu_position_for_price: z.enum(["too_weak", "borderline", "ok", "strong"]),
      explanation: z.string().min(1),
      redFlags: z.array(z.string().min(1)),
      notes: z.array(z.string().min(1)),
    })
    .optional(),
});

export type CheckerOutput = z.infer<typeof checkerOutputSchema>;
