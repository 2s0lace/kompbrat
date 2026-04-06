import Link from "next/link";

import type { BuildLink } from "@/types/build";

import { buttonVariants } from "@/components/ui/button";
import { buildAffiliateRedirectHref } from "@/lib/affiliate/tracking";
import { cn } from "@/lib/utils/cn";

export function AffiliateButton({ link, slug }: { link: BuildLink; slug?: string }) {
  return (
    <Link
      href={buildAffiliateRedirectHref(link, { slug })}
      target="_blank"
      rel="noreferrer"
      className={cn(buttonVariants({ variant: link.provider === "ceneo" ? "default" : "outline" }), "w-full justify-between")}
    >
      <span>{link.label}</span>
      <span className="text-[11px] uppercase tracking-[0.18em] opacity-70">{link.provider}</span>
    </Link>
  );
}
