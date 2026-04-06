import { createMockResults } from "@/lib/search/search-utils";

export async function searchWithBrave(query: string) {
  if (!process.env.BRAVE_API_KEY && !process.env.BRAVE_SEARCH_API_KEY) {
    return createMockResults(query);
  }

  return createMockResults(query);
}
