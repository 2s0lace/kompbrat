import { PromptChip } from "@/components/shared/prompt-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BuilderExamplesProps = {
  prompts: string[];
  onSelectPrompt?: (prompt: string) => void;
};

export function BuilderExamples({ prompts, onSelectPrompt }: BuilderExamplesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Przykładowe prompty</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {prompts.map((prompt) => (
          <button key={prompt} type="button" className="w-full text-left" onClick={() => onSelectPrompt?.(prompt)}>
            <PromptChip prompt={prompt} />
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
