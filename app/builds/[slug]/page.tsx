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
import {
  getBuildById,
  getBuildCategoryLabel,
  getBuildExternalLinks,
  getBuildSourceTypeBadgeVariant,
  getBuildSourceTypeLabel,
} from "@/lib/builds/utils";

export function generateStaticParams() {
  return allBuilds.map((build) => ({ slug: build.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const build = getBuildById(slug);

  if (!build) {
    return {
      title: "Build nie znaleziony",
      description: "Ten build KOMPBRAT nie istnieje albo został usunięty.",
    };
  }

  return {
    title: `${build.title} | ${build.priceRange}`,
    description: `${build.shortDescription} ${build.description}`,
  };
}

export default async function BuildDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const build = getBuildById(slug);

  if (!build) {
    notFound();
  }

  const links = getBuildExternalLinks(build);

  return (
    <PageShell title={build.title} description={build.description} eyebrow="Szczegóły buildu">
      <Section
        title="Szybki kontekst"
        description="Najważniejsze informacje o segmencie: zastosowanie, widełki cenowe i sposób sourcingu."
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{getBuildCategoryLabel(build.category)}</Badge>
                <Badge variant={getBuildSourceTypeBadgeVariant(build.sourceType)}>{getBuildSourceTypeLabel(build.sourceType)}</Badge>
                {build.featured ? <Badge variant="default">Handpicked</Badge> : null}
              </div>
              <CardTitle className="text-3xl">{build.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="surface-muted flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">Segment cenowy</span>
                <span className="text-sm font-semibold text-secondary">{build.priceRange}</span>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{build.shortDescription}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tagi i wariant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {build.tags.map((tag) => (
                  <Badge key={`${build.id}-${tag}`} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
              {build.variant ? (
                <div className="rounded-[20px] bg-neutral/70 p-4 text-sm text-secondary">Wariant: {build.variant}</div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Opis segmentu" description="Krótko i po ludzku: czego można się po tym zestawie spodziewać.">
        <BuildVerdict verdict={build.shortDescription} description={build.description} badgeLabel="Segment KOMPBRAT" />
      </Section>

      <Section title="Specyfikacja" description="Pełna rozpiska komponentów bez tabel i bez marketingowego hałasu.">
        <BuildSpecs build={build} />
      </Section>

      <Section title="Dlaczego ma sens" description="Dla kogo ten zestaw jest dobrym wyborem i co go broni jako sensownego punktu startowego.">
        <BuildProsCons build={build} />
      </Section>

      {links.length > 0 ? (
        <Section title="Linki zewnętrzne" description="Wyjścia do sklepów albo źródeł ofert powiązanych z tym buildem.">
          <div className="grid gap-3 md:grid-cols-2">
            {links.map((link) => (
              <AffiliateButton key={`${link.provider}-${link.url}`} link={link} slug={build.id} />
            ))}
          </div>
        </Section>
      ) : null}
    </PageShell>
  );
}
