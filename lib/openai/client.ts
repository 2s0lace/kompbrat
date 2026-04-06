const OPENAI_RESPONSES_API_URL = "https://api.openai.com/v1/responses";

export function getOpenAIIntentConfig() {
  return {
    model: process.env.OPENAI_INTENT_MODEL ?? "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
    apiUrl: OPENAI_RESPONSES_API_URL,
    enabled: Boolean(process.env.OPENAI_API_KEY),
  };
}

export async function requestStructuredJson<T>(input: {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
}): Promise<T | null> {
  const config = getOpenAIIntentConfig();

  if (!config.enabled || !config.apiKey) {
    return null;
  }

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: [
        { role: "system", content: [{ type: "input_text", text: input.system }] },
        { role: "user", content: [{ type: "input_text", text: input.user }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          schema: input.schema,
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const json = (await response.json()) as { output_text?: string };
  if (!json.output_text) {
    return null;
  }

  try {
    return JSON.parse(json.output_text) as T;
  } catch {
    return null;
  }
}
