"use client";

import { useState } from "react";

import Link from "next/link";

import { PromptImportModal } from "@/components/shared/prompt-import-modal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const sideNav = [
  { label: "Dobierz komputer", href: "/builder", active: false, icon: "⬛" },
  { label: "Sprawdź ofertę", href: "/checker", active: true, icon: "✔" },
  { label: "Buildy", href: "/builds", active: false, icon: "✦" },
];

const offerParts = [
  {
    id: "title",
    label: "TYTUŁ OFERTY",
    name: "RTX 3060 / Ryzen 5 5600",
    sub: "OLX · Warszawa",
    stat: "LINK ZWERYFIKOWANY",
    style: { top: "10%", left: "15%" },
    accent: "#8a9a5b",
  },
  {
    id: "price",
    label: "CENA",
    name: "2 800 zł",
    sub: "Wycena rynku: 2 400–2 650 zł",
    stat: "⚠ CENA POWYŻEJ RYNKU",
    style: { top: "10%", left: "50%" },
    accent: "#c47e60",
    warning: true,
  },
  {
    id: "spec",
    label: "SPECYFIKACJA",
    name: "Ryzen 5 5600",
    sub: "RTX 3060 · 16 GB RAM",
    stat: "KOMPLETNA",
    style: { top: "46%", left: "30%" },
    accent: "#8a9a5b",
    highlight: true,
  },
  {
    id: "warranty",
    label: "GWARANCJA",
    name: "Brak / bez zwrotu",
    sub: "Sprzedający: prywatny",
    stat: "⚠ RYZYKO PRAWNE",
    style: { top: "64%", left: "12%" },
    accent: "#c47e60",
    warning: true,
    hideMobile: true,
  },
  {
    id: "condition",
    label: "STAN",
    name: "Używany, 2 lata",
    sub: "Brak zdjęć środka",
    stat: "⚠ SPRAWDŹ DOKŁADNIE",
    style: { top: "60%", left: "55%" },
    accent: "#c47e60",
    warning: true,
    hideMobile: true,
  },
];

const svgLines = [
  { x1: "30%", y1: "20%", x2: "50%", y2: "20%" },
  { x1: "42%", y1: "24%", x2: "44%", y2: "52%" },
  { x1: "44%", y1: "56%", x2: "28%", y2: "68%" },
  { x1: "55%", y1: "56%", x2: "65%", y2: "66%" },
];

const flags = [
  { text: "Za tanio jak na specyfikację", tone: "ok" as const },
  { text: "Cena powyżej wartości rynkowej", tone: "bad" as const },
  { text: "Brak gwarancji i zwrotu", tone: "bad" as const },
  { text: "Niepełny opis — brak zdjęć środka", tone: "bad" as const },
];

export function CheckerHero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{
          height: "clamp(520px, calc(100vh - 73px), 900px)",
        }}
        aria-label="Checker — podgląd aplikacji"
      >
        <div className="flex h-full">
          {/* ── LEFT SIDEBAR (desktop only) ── */}
          <aside
            className="hidden h-full w-52 shrink-0 flex-col border-r lg:flex"
            style={{
              background: "linear-gradient(180deg, #f5f3e8 0%, #eceadb 100%)",
              borderColor: "rgba(72,60,50,0.12)",
            }}
          >
            <div className="border-b px-5 py-5" style={{ borderColor: "rgba(72,60,50,0.1)" }}>
              <p className="font-serif text-xl font-bold tracking-tight" style={{ color: "#2d2a1e" }}>KOMPBRAT</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#8a9a5b" }}>
                Twój brat od komputerów
              </p>
            </div>
            <nav className="flex-1 space-y-0.5 px-3 py-4">
              {sideNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-[#2d2a1e] text-[#c8d08a]"
                      : "text-[#5a5240] hover:bg-black/5 hover:text-[#2d2a1e]"
                  )}
                >
                  <span className="text-xs opacity-70">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t p-4" style={{ borderColor: "rgba(72,60,50,0.1)" }}>
              <Link
                href="/checker"
                className={cn(buttonVariants({ variant: "default" }), "w-full justify-center text-xs uppercase tracking-widest")}
              >
                Sprawdź nową ofertę
              </Link>
            </div>
          </aside>

          {/* ── CENTER CANVAS ── */}
          <div
            className="relative flex-1 overflow-hidden"
            style={{ background: "linear-gradient(160deg, #14130e 0%, #1c1b12 60%, #0f1208 100%)" }}
          >
            {/* Grid */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(180,190,120,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(180,190,120,0.7) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            {/* Glow */}
            <div
              className="pointer-events-none absolute opacity-15"
              style={{
                top: "35%", left: "40%",
                width: 320, height: 320, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(196,126,96,0.7) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />

            {/* ── MOBILE TOP BAR ── */}
            <div
              className="flex items-center justify-between px-4 py-3 lg:hidden"
              style={{ borderBottom: "1px solid rgba(196,126,96,0.15)" }}
            >
              <div>
                <p className="font-serif text-sm font-bold" style={{ color: "#e8e4d0" }}>KOMPBRAT</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#c47e60" }}>Checker</p>
              </div>
              <div className="flex items-center gap-2">
                {sideNav.slice(0, 3).map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                      item.active
                        ? "bg-[#c47e60]/20 text-[#e8c4a0]"
                        : "text-[rgba(200,195,170,0.5)] hover:text-[rgba(200,195,170,0.8)]"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* SVG lines (desktop) */}
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
              style={{ zIndex: 1 }}
              aria-hidden
            >
              {svgLines.map((l, i) => (
                <line
                  key={i}
                  x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="rgba(196,126,96,0.3)"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                />
              ))}
            </svg>

            {/* Desktop floating cards */}
            {offerParts.map((part) => (
              <div
                key={part.id}
                className={cn("absolute animate-fade-up hidden lg:block", part.hideMobile ? "" : "")}
                style={{ zIndex: 2, ...part.style }}
              >
                <div
                  className="rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm"
                  style={{
                    background: part.highlight
                      ? "linear-gradient(145deg, rgba(30,32,18,0.98) 0%, rgba(22,28,14,0.98) 100%)"
                      : "rgba(22,22,14,0.92)",
                    borderColor: part.highlight
                      ? "rgba(106,170,106,0.5)"
                      : part.warning
                      ? "rgba(196,126,96,0.35)"
                      : "rgba(138,154,91,0.2)",
                    minWidth: 180,
                  }}
                >
                  <div className="flex items-center justify-between gap-6">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: part.accent }}>{part.label}</p>
                    {part.highlight && <div className="h-1.5 w-1.5 rounded-full bg-green-400" />}
                  </div>
                  <p className="mt-2 font-serif text-xl font-semibold leading-tight" style={{ color: "#e8e4d0" }}>{part.name}</p>
                  <p className="mt-0.5 text-xs" style={{ color: "rgba(200,195,170,0.5)" }}>{part.sub}</p>
                  <div className="mt-3 border-t pt-2.5" style={{ borderColor: "rgba(138,154,91,0.15)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: part.warning ? "#c47e60" : "rgba(138,154,91,0.8)" }}>
                      {part.stat}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile cards (top 3 only, repositioned) */}
            <div className="lg:hidden">
              {offerParts.slice(0, 3).map((part, i) => {
                const positions = [
                  { top: "18%", left: "4%" },
                  { top: "14%", right: "4%", left: "auto" },
                  { top: "44%", left: "50%", transform: "translateX(-50%)" },
                ];
                return (
                  <div key={part.id + "-mob"} className="absolute animate-fade-up" style={{ zIndex: 2, ...positions[i] }}>
                    <div
                      className="rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-sm"
                      style={{
                        background: part.highlight
                          ? "linear-gradient(145deg, rgba(30,32,18,0.98) 0%, rgba(22,28,14,0.98) 100%)"
                          : "rgba(22,22,14,0.90)",
                        borderColor: part.highlight
                          ? "rgba(106,170,106,0.5)"
                          : part.warning
                          ? "rgba(196,126,96,0.35)"
                          : "rgba(138,154,91,0.2)",
                        minWidth: 140,
                        maxWidth: 158,
                      }}
                    >
                      <p className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: part.accent }}>{part.label}</p>
                      <p className="mt-1.5 font-serif text-base font-semibold leading-tight" style={{ color: "#e8e4d0" }}>{part.name}</p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "rgba(200,195,170,0.45)" }}>{part.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2" style={{ zIndex: 3 }}>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition hover:bg-white/5"
                style={{
                  background: "rgba(196,126,96,0.15)",
                  borderColor: "rgba(196,126,96,0.4)",
                  color: "#e8c4a0",
                }}
                id="checker-prompt-open"
              >
                <span>⊕</span> Wklej ofertę
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold"
                style={{ background: "rgba(22,22,14,0.85)", borderColor: "rgba(138,154,91,0.25)", color: "#c8d08a" }}
                aria-label="Odsuń"
              >
                −
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold"
                style={{ background: "rgba(22,22,14,0.85)", borderColor: "rgba(138,154,91,0.25)", color: "#c8d08a" }}
                aria-label="Przybliż"
              >
                +
              </button>
              <button
                className="hidden items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-widest sm:flex"
                style={{ background: "rgba(22,22,14,0.85)", borderColor: "rgba(138,154,91,0.25)", color: "#c8d08a" }}
              >
                <span className="opacity-70">◎</span> Widok analizy
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL (xl) ── */}
          <aside
            className="hidden h-full w-72 shrink-0 overflow-y-auto border-l xl:block"
            style={{
              background: "linear-gradient(180deg, #f5f3e8 0%, #eceadb 100%)",
              borderColor: "rgba(72,60,50,0.12)",
            }}
          >
            <div className="space-y-6 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#c47e60" }}>● Wynik analizy</p>
                <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight" style={{ color: "#2d2a1e" }}>
                  Oferta <em>średnia</em>
                </h2>
                <p className="mt-3 text-sm leading-6" style={{ color: "#6b6347" }}>
                  Sprzęt jest uczciwy, ale cena jest o 150–250 zł powyżej rynku i brakuje gwarancji. Negocjuj lub szukaj dalej.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Ocena oferty", value: "54 / 100", pct: 54, color: "#c47e60" },
                  { label: "Stosunek cena / wartość", value: "Słaby", pct: 30, color: "#c47e60" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#9aa06a" }}>{s.label}</p>
                      <p className="text-sm font-bold" style={{ color: "#2d2a1e" }}>{s.value}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full" style={{ background: "rgba(72,60,50,0.12)" }}>
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Cena oferty", value: "2 800 zł" },
                  { label: "Wycena rynku", value: "2 500 zł" },
                  { label: "Różnica", value: "+300 zł" },
                  { label: "Werdykt", value: "Negocjuj" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border p-3" style={{ background: "rgba(255,252,244,0.6)", borderColor: "rgba(72,60,50,0.1)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "#9aa06a" }}>{s.label}</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "#2d2a1e" }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#9aa06a" }}>Na co uważać</p>
                <div className="mt-3 space-y-2">
                  {flags.map((f) => (
                    <div
                      key={f.text}
                      className="flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-xs font-medium"
                      style={{
                        background: f.tone === "bad" ? "rgba(196,126,96,0.1)" : "rgba(138,154,91,0.1)",
                        borderColor: f.tone === "bad" ? "rgba(196,126,96,0.25)" : "rgba(138,154,91,0.25)",
                        color: "#2d2a1e",
                      }}
                    >
                      <span>{f.tone === "bad" ? "⚠" : "✓"}</span>
                      {f.text}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border p-4" style={{ background: "rgba(224,229,198,0.5)", borderColor: "rgba(138,154,91,0.2)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#8a9a5b" }}>Werdykt Brata</p>
                <p className="mt-2 text-xs leading-5 italic" style={{ color: "#5a5240" }}>
                  &quot;Sprzęt uczciwy, ale cena zawyżona. Zaproponuj 2 500 zł z argumentem braku gwarancji. Jeśli odrzuci — łatwo znajdziesz lepiej.&quot;
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <PromptImportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="checker"
      />
    </>
  );
}
