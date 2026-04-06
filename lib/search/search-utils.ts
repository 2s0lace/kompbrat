import type { SearchResult } from "@/types/search";

export function createMockResults(query: string): SearchResult[] {
  return [
    {
      title: `Wynik dla: ${query}`,
      url: "https://example.com/oferta",
      snippet: "Placeholder pod wyniki wyszukiwania. Tutaj podepniesz realny provider i normalizację danych.",
      source: "mock",
      price: 2499,
    },
  ];
}
