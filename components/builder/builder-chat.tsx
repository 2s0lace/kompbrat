import type { ChatRole } from "@/types/ai";

import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BuilderChatMessage = {
  role: ChatRole;
  content: string;
};

type BuilderChatProps = {
  messages: BuilderChatMessage[];
};

export function BuilderChat({ messages }: BuilderChatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Odpowiedź AI</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4" aria-live="polite">
        {messages.map((message) => (
          <div
            key={`${message.role}-${message.content}`}
            className={
              message.role === "assistant"
                ? "rounded-[24px] bg-secondary p-4 text-secondary-foreground"
                : "rounded-[24px] border border-border/80 bg-card/70 p-4"
            }
          >
            <p
              className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                message.role === "assistant" ? "text-secondary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {message.role === "assistant" ? "KOMPBRAT" : "Ty"}
            </p>
            <div className={message.role === "assistant" ? "text-secondary-foreground" : ""}>
              <MarkdownRenderer content={message.content} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
