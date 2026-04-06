import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <div className="container-shell py-12 sm:py-16 lg:py-20">
      <header className="max-w-3xl space-y-4">
        <span className="inline-flex rounded-full border border-border/70 bg-card/75 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
          {eyebrow}
        </span>
        <h1 className="font-serif text-4xl tracking-tight text-secondary sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>
      </header>
      <div className="mt-10 space-y-10 lg:mt-12">{children}</div>
    </div>
  );
}
