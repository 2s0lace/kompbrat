const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export function getModelConfig() {
  return {
    provider: "openai",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    apiUrl: OPENAI_API_URL,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
  };
}
