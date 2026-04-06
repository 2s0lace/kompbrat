import { z } from "zod";

import { MAX_BUILDER_BUDGET } from "@/lib/builder/budget-guardrails";

export const builderMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});

export const builderSchema = z
  .object({
    prompt: z.string().min(3).optional(),
    budget: z.coerce.number().positive().max(MAX_BUILDER_BUDGET, `KOMPBRAT na ten moment obsługuje budżety do ${MAX_BUILDER_BUDGET.toLocaleString("pl-PL")} zł.`).optional(),
    useCase: z.string().min(2).optional(),
    marketMode: z.enum(["new", "used", "mixed"]).optional(),
    messages: z.array(builderMessageSchema).min(1).optional(),
  })
  .refine((value) => value.prompt || value.messages?.length, {
    message: "Podaj `prompt` albo `messages`.",
    path: ["prompt"],
  });

export const builderOutputSchema = z.object({
  summary: z.string().min(1),
  buildName: z.string().min(1),
  forWho: z.string().min(1),
  parts: z
    .array(
      z.object({
        type: z.string().min(1),
        name: z.string().min(1),
        condition: z.enum(["new", "used"]).optional(),
      }),
    )
    .min(1),
  notes: z.array(z.string().min(1)).default([]),
  warnings: z.array(z.string().min(1)).default([]),
  selectedMode: z.enum(["new", "used", "mixed"]).optional(),
  actualModeUsed: z.enum(["new", "used", "mixed"]).nullable().optional(),
  feasibleInSelectedMode: z.boolean().optional(),
  recommendedFallbackMode: z.enum(["new", "used", "mixed"]).nullable().optional(),
  modeMessage: z.string().min(1).optional(),
  warningMessage: z.string().min(1).optional(),
  recommendationMode: z.enum(["new", "used", "mixed"]).optional(),
  policyReason: z.string().min(1).optional(),
  alternative: z
    .object({
      buildName: z.string().min(1),
      recommendationMode: z.enum(["new", "used", "mixed"]),
      summary: z.string().min(1),
    })
    .optional(),
});

export type BuilderInput = z.infer<typeof builderSchema>;
export type BuilderOutput = z.infer<typeof builderOutputSchema>;
