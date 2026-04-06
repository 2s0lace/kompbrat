import { buildPricePart, extractOfferDetections, mergeDetectedParts, parsePrice, pushPart } from "@/lib/checker/entity-detection";
import { preprocessText } from "@/lib/checker/text-preprocessing";
import type { ParsedOffer } from "@/types/checker";

export function parseFromTitle(title: string) {
  return extractOfferDetections(title, "title");
}

export function parseFromDescription(description: string) {
  return extractOfferDetections(description, "description");
}

export function parseOffer(input: {
  title?: string;
  description?: string;
  price?: number;
}): ParsedOffer {
  const title = preprocessText(input.title ?? "");
  const description = preprocessText(input.description ?? "");
  const combined = preprocessText(`${title.raw} ${description.raw}`.trim());
  const titleParts = extractOfferDetections(input.title ?? "", "title");
  const descriptionParts = extractOfferDetections(input.description ?? "", "description");
  const detectedParts = mergeDetectedParts(titleParts, descriptionParts);
  const parsedPrice = input.price ?? parsePrice(title, description);

  if (typeof parsedPrice === "number") {
    pushPart(detectedParts, buildPricePart(parsedPrice, input.price ? "explicit" : title.raw ? "title" : "description"));
  }

  return {
    detectedParts,
    normalizedText: combined.normalized,
    titleText: title.normalized,
    descriptionText: description.normalized,
    preprocessed: {
      title,
      description,
      combined,
    },
    price: parsedPrice,
    signals: {
      hasWarrantyInfo: /(gwarancja|pisemna gwarancja|warranty)/i.test(`${input.title ?? ""}\n${input.description ?? ""}`),
    },
  };
}

export { preprocessText } from "@/lib/checker/text-preprocessing";
export { mergeDetectedParts } from "@/lib/checker/entity-detection";
