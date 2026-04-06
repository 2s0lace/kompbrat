import type { ReactNode } from "react";

type SectionProps = {
  id?: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} className="space-y-5">
      <div className="max-w-2xl space-y-2">
        <h2 className="font-serif text-2xl tracking-tight text-secondary">{title}</h2>
        <p className="leading-7 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}
