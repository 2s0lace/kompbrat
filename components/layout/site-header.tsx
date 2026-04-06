"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/builder", label: "Dobierz komputer" },
  { href: "/checker", label: "Sprawdź ofertę" },
  { href: "/builds", label: "Buildy" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="container-shell flex flex-col gap-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <nav aria-label="Nawigacja główna" className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/80 p-1 shadow-lift md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-neutral hover:text-secondary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/builder" className={cn(buttonVariants({ variant: "secondary" }), "px-4 py-2 text-xs sm:text-sm")}>
            Zacznij z Bratem
          </Link>
        </div>

        <nav aria-label="Nawigacja mobilna" className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium shadow-lift transition",
                pathname === item.href
                  ? "border-secondary bg-secondary text-secondary-foreground"
                  : "border-border/70 bg-card/85 text-secondary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
