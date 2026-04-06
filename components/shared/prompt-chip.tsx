type PromptChipProps = {
  prompt: string;
};

export function PromptChip({ prompt }: PromptChipProps) {
  return (
    <div className="rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm text-secondary shadow-lift">
      {prompt}
    </div>
  );
}
