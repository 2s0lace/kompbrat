import type { Metadata } from "next";

import { BuilderWorkspace } from "@/components/builder/builder-workspace";
import { PageShell } from "@/components/layout/page-shell";
import { builderCopy } from "@/content/copy/builder";

export const metadata: Metadata = {
  title: "Dobierz komputer z Bratem",
  description: "Opisz budżet, zastosowanie i preferencje, a KOMPBRAT podpowie sensowny zestaw i kompromisy.",
};

export default function BuilderPage() {
  return (
    <PageShell
      title={builderCopy.title}
      description={builderCopy.description}
      eyebrow="Builder KOMPBRAT"
    >
      <BuilderWorkspace />
    </PageShell>
  );
}
