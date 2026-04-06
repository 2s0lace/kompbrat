import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AffiliateButton } from "@/components/builds/affiliate-button";
import { BuildProsCons } from "@/components/builds/build-pros-cons";
import { BuildSpecs } from "@/components/builds/build-specs";
import { BuildVerdict } from "@/components/builds/build-verdict";
import { PageShell } from "@/components/layout/page-shell";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { allBuilds } from "@/lib/builds/data";
import { getBuildBySlug, getBuildCategoryLabel, getBuildExternalLinks, getBuildSourceTypeLabel } from "@/lib/builds/utils";
import { formatPrice } from "@/lib/utils/format-price";

export function generateStaticParams() {
  return allBuilds.map((build) => ({ slug: build.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const build = getBuildBySlug(slug);

  if (!build) {
    return {
      title: "Build nie znaleziony",
      description: "Ten build KOMPBRAT nie istnieje albo został usunięty.",
    };
  }

  return {
    title: `${build.title} — ${getBuildCategoryLabel(build.category)}`,
    description: `${build.shortVerdict} Cena docelowa: ${formatPrice(build.price)}. ${build.description}`,
  };
}

export default async function BuildDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const build = getBuildBySlug(slug);

  if (!build) {
    notFound();
  }

  const links = getBuildExternalLinks(build);

  return (
    <PageShell title={build.title} description={build.description} eyebrow="Szczegóły buildu">
      <Section
        title="Use case"
        description="Tutaj masz szybki kontekst: dla kogo ten build ma sens, skąd bierze się cena i czy to sklep, czy używki."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {build.badgeLabel ? <Badge variant="default">{build.badgeLabel}</Badge> : null}
                <Badge variant={build.category === "uzywany" ? "warning" : "outline"}>
                  {getBuildCategoryLabel(build.category)}
                </Badge>
                <Badge variant="outline">{getBuildSourceTypeLabel(build.sourceType)}</Badge>
              </div>
              <CardTitle className="text-3xl">{build.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="surface-muted flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Cena</span>
                <span className="text-sm font-semibold text-secondary">{formatPrice(build.price)}</span>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{build.useCase}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Źródło buildu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[20px] bg-neutral/70 p-4 text-sm text-secondary">
                {build.sourceType === "olx-allegro"
                  ? "Ten build opiera się o wzorzec ofert z OLX i Allegro."
                  : "Ten build jest rozpisany pod sklepy i nowe części."}
              </div>
              <div className="rounded-[20px] bg-neutral/70 p-4 text-sm text-secondary">
                Kategoria: {getBuildCategoryLabel(build.category)}
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section
        title="Werdykt Brata"
        description="Krótko i po ludzku: czy ten build ma sens, dla kogo i gdzie są jego granice."
      >
        <BuildVerdict verdict={build.shortVerdict} description={build.description} badgeLabel={build.badgeLabel} />
      </Section>

      <Section
        title="Specyfikacja"
        description="Pełna rozpiska części w prostym układzie, bez korpo tabelki i bez marketingowego bełkotu."
      >
        <BuildSpecs build={build} />
      </Section>

      <Section
        title="Plusy i minusy"
        description="Krótko i konkretnie: co w tym buildzie ma sens, a gdzie są kompromisy."
      >
        <BuildProsCons build={build} />
      </Section>

      <Section
        title="Linki zewnętrzne"
        description="Wyjścia do sklepów albo źródeł ofert. Na MVP to proste przyciski bez dodatkowej magii."
      >
        <div className="grid gap-3 md:grid-cols-2">
          {links.map((link) => (
            <AffiliateButton key={`${link.provider}-${link.url}`} link={link} slug={build.slug} />
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
