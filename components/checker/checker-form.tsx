"use client";

import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { checkerCopy } from "@/content/copy/checker";

type CheckerFormProps = {
  title: string;
  price: string;
  url: string;
  description: string;
  isPending: boolean;
  onTitleChange: (value: string) => void;
  onPriceChange: (value: string) => void;
  onUrlChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
};

export function CheckerForm({
  title,
  price,
  url,
  description,
  isPending,
  onTitleChange,
  onPriceChange,
  onUrlChange,
  onDescriptionChange,
  onSubmit,
}: CheckerFormProps) {
  const titleId = "checker-title";
  const priceId = "checker-price";
  const urlId = "checker-url";
  const descriptionId = "checker-description";

  return (
    <Card className="rounded-[34px] border-border/70 bg-white/90 shadow-[0_20px_60px_rgba(67,53,40,0.08)]">
      <CardHeader className="space-y-3 p-7 sm:p-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Formularz analizy</p>
          <CardTitle className="text-2xl">{checkerCopy.formTitle}</CardTitle>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{checkerCopy.formDescription}</p>
      </CardHeader>
      <CardContent className="p-7 pt-0 sm:p-8 sm:pt-0">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label htmlFor={titleId} className="text-sm font-semibold text-secondary">
                Tytuł oferty
              </label>
              <Input
                id={titleId}
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="Np. PC RTX 3060 / Ryzen 5 5600 / 16 GB"
                className="h-12 rounded-2xl bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={priceId} className="text-sm font-semibold text-secondary">
                Cena oferty
              </label>
              <Input
                id={priceId}
                value={price}
                onChange={(event) => onPriceChange(event.target.value)}
                placeholder="Np. 2399"
                type="number"
                className="h-12 rounded-2xl bg-background/70"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor={urlId} className="text-sm font-semibold text-secondary">
                Link do oferty
              </label>
              <Input
                id={urlId}
                value={url}
                onChange={(event) => onUrlChange(event.target.value)}
                placeholder="Opcjonalnie: https://..."
                type="url"
                className="h-12 rounded-2xl bg-background/70"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor={descriptionId} className="text-sm font-semibold text-secondary">
              Opis oferty albo surowe podzespoły
            </label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
              placeholder="Wklej opis z OLX lub Allegro albo po prostu listę części z ceną."
              className="min-h-[220px] rounded-[26px] bg-background/70"
            />
            <p className="text-xs text-muted-foreground">
              Im więcej konkretów o GPU, CPU, dysku i zasilaczu, tym lepszy werdykt.
            </p>
          </div>
          <Button type="submit" disabled={isPending || !description.trim()} className="h-12 w-full text-base">
            {isPending ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Sprawdzam ofertę...
              </>
            ) : (
              "Sprawdź ofertę"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
