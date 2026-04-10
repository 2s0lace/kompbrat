"use client";

import { useState } from "react";

import Link from "next/link";

import { PromptImportModal } from "@/components/shared/prompt-import-modal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const sideNav = [
  { label: "Dobierz komputer", href: "/builder", active: true, icon: "⬛" },
  { label: "Sprawdź ofertę", href: "/checker", active: false, icon: "✔" },
  { label: "Buildy", href: "/builds", active: false, icon: "✦" },
];

const parts = [
  {
    id: "cpu",
    label: "PROCESOR",
    name: "Ryzen 5 7600X",
    sub: "AM5 / 6 rdzeni",
    stat: "LOAD 18%",
    /* desktop */ style: { top: "18%", left: "12%" },
    /* mobile  */ mobileStyle: { top: "8%", left: "2%" },
    accent: "#8a9a5b",
  },
  {
    id: "ram",
    label: "PAMIĘĆ",
    name: "32GB DDR5",
    sub: "6000 MHz CL30",
    stat: "DUAL CHANNEL",
    style: { top: "12%", left: "44%" },
    mobileStyle: { top: "8%", right: "2%", left: "auto" },
    accent: "#8a9a5b",
  },
  {
    id: "gpu",
    label: "GRAFIKA",
    name: "RTX 4070 Super",
    sub: "12GB GDDR6X",
    stat: "320W TDP",
    style: { top: "44%", left: "36%" },
    mobileStyle: { top: "38%", left: "50%", transform: "translateX(-50%)" },
    accent: "#6aaa6a",
    highlight: true,
  },
  {
    id: "mobo",
    label: "PŁYTA GŁÓWNA",
    name: "B650 Tomahawk",
    sub: "PCIe 5.0 / 4× DDR5",
    stat: "ATX",
    style: { top: "64%", left: "48%" },
    mobileStyle: { top: "68%", right: "2%", left: "auto" },
    accent: "#8a9a5b",
    hideMobile: true,
  },
  {
    id: "psu",
    label: "ZASILACZ",
    name: "750W Gold",
    sub: "Seasonic Focus",
    stat: "⚠ MARGINAL HEADROOM",
    style: { top: "66%", left: "10%" },
    mobileStyle: { top: "68%", left: "2%" },
    accent: "#c47e60",
    warning: true,
    hideMobile: true,
  },
];

const svgLines = [
  { x1: "24%", y1: "26%", x2: "44%", y2: "20%" },
  { x1: "40%", y1: "26%", x2: "44%", y2: "20%" },
  { x1: "36%", y1: "28%", x2: "40%", y2: "50%" },
  { x1: "55%", y1: "58%", x2: "60%", y2: "70%" },
  { x1: "20%", y1: "32%", x2: "18%", y2: "70%" },
];

export function BuilderHero() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{
          height: "clamp(520px, calc(100vh - 73px), 900px)",
        }}
        aria-label="Builder — podgląd aplikacji"
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
              <p className="font-serif text-xl font-bold tracking-tight" style={{ color: "#2d2a1e" }}>
                KOMPBRAT
              </p>
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
                href="/builder"
                className={cn(buttonVariants({ variant: "default" }), "w-full justify-center text-xs uppercase tracking-widest")}
              >
                Nowa konfiguracja
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
              className="pointer-events-none absolute opacity-20"
              style={{
                top: "30%", left: "35%",
                width: 320, height: 320, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(106,170,106,0.6) 0%, transparent 70%)",
                filter: "blur(60px)",
              }}
            />

            {/* ── MOBILE TOP BAR ── */}
            <div
              className="flex items-center justify-between px-4 py-3 lg:hidden"
              style={{ borderBottom: "1px solid rgba(138,154,91,0.15)" }}
            >
              <div>
                <p className="font-serif text-sm font-bold" style={{ color: "#e8e4d0" }}>KOMPBRAT</p>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#8a9a5b" }}>
                  Builder
                </p>
              </div>
              <div className="flex items-center gap-2">
                {sideNav.slice(0, 3).map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition",
                      item.active
                        ? "bg-[#8a9a5b]/20 text-[#c8d08a]"
                        : "text-[rgba(200,195,170,0.5)] hover:text-[rgba(200,195,170,0.8)]"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* SVG lines (desktop only) */}
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
              style={{ zIndex: 1 }}
              aria-hidden
            >
              {svgLines.map((l, i) => (
                <line
                  key={i}
                  x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                  stroke="rgba(138,154,91,0.35)"
                  strokeWidth="1"
                  strokeDasharray="5 4"
                />
              ))}
            </svg>

            {/* Floating cards */}
            {parts.map((part) => (
              <div
                key={part.id}
                className={cn(
                  "absolute animate-fade-up",
                  part.hideMobile ? "hidden lg:block" : ""
                )}
                style={{
                  zIndex: 2,
                  /* mobile style applied via responsive override below */
                  ...part.style,
                }}
              >
                {/* Desktop card */}
                <div
                  className="hidden lg:block rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-sm"
                  style={{
                    background: part.highlight
                      ? "linear-gradient(145deg, rgba(30,32,18,0.98) 0%, rgba(22,28,14,0.98) 100%)"
                      : "rgba(22,22,14,0.92)",
                    borderColor: part.highlight
                      ? "rgba(106,170,106,0.5)"
                      : "rgba(138,154,91,0.2)",
                    minWidth: 180,
                  }}
                >
                  <div className="flex items-center justify-between gap-6">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: part.accent }}>
                      {part.label}
                    </p>
                    {part.highlight && <div className="h-1.5 w-1.5 rounded-full bg-green-400" />}
                  </div>
                  <p className="mt-2 font-serif text-xl font-semibold leading-tight" style={{ color: "#e8e4d0" }}>
                    {part.name}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "rgba(200,195,170,0.5)" }}>{part.sub}</p>
                  <div className="mt-3 border-t pt-2.5" style={{ borderColor: "rgba(138,154,91,0.15)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: part.warning ? "#c47e60" : "rgba(138,154,91,0.8)" }}>
                      {part.warning && "⚠ "}{part.stat}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* ── MOBILE CARDS (separate, repositioned) ── */}
            <div className="lg:hidden">
              {parts.slice(0, 3).map((part, i) => {
                const positions = [
                  { top: "18%", left: "4%" },
                  { top: "14%", right: "4%", left: "auto" },
                  { top: "46%", left: "50%", transform: "translateX(-50%)" },
                ];
                return (
                  <div
                    key={part.id + "-mob"}
                    className="absolute animate-fade-up"
                    style={{ zIndex: 2, ...positions[i] }}
                  >
                    <div
                      className="rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-sm"
                      style={{
                        background: part.highlight
                          ? "linear-gradient(145deg, rgba(30,32,18,0.98) 0%, rgba(22,28,14,0.98) 100%)"
                          : "rgba(22,22,14,0.90)",
                        borderColor: part.highlight
                          ? "rgba(106,170,106,0.5)"
                          : "rgba(138,154,91,0.2)",
                        minWidth: 140,
                        maxWidth: 160,
                      }}
                    >
                      <p className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: part.accent }}>
                        {part.label}
                      </p>
                      <p className="mt-1.5 font-serif text-base font-semibold leading-tight" style={{ color: "#e8e4d0" }}>
                        {part.name}
                      </p>
                      <p className="mt-0.5 text-[10px]" style={{ color: "rgba(200,195,170,0.45)" }}>{part.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2" style={{ zIndex: 3 }}>
              {/* Open prompt modal button */}
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition hover:bg-white/5"
                style={{
                  background: "rgba(138,154,91,0.15)",
                  borderColor: "rgba(138,154,91,0.4)",
                  color: "#c8d08a",
                }}
                id="builder-prompt-open"
              >
                <span>✦</span> Wpisz brief
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
                <span className="opacity-70">◉</span> Widok topologii
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL (xl only) ── */}
          <aside
            className="hidden h-full w-72 shrink-0 overflow-y-auto border-l xl:block"
            style={{
              background: "linear-gradient(180deg, #f5f3e8 0%, #eceadb 100%)",
              borderColor: "rgba(72,60,50,0.12)",
            }}
          >
            <div className="space-y-6 p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#c47e60" }}>
                  ● Brat analizuje
                </p>
                <h2 className="mt-2 font-serif text-3xl leading-tight tracking-tight" style={{ color: "#2d2a1e" }}>
                  RTX 4070 <em>Super</em>
                </h2>
                <p className="mt-3 text-sm leading-6" style={{ color: "#6b6347" }}>
                  Solidny wybór dla 1440p z headroomem na ray-tracing. Świetny balans mocy
                  i poboru energii w tym budżecie.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { label: "Synergia zestawu", value: "91%", pct: 91, color: "#8a9a5b" },
                  { label: "Ryzyko wąskiego gardła", value: "Minimalne", pct: 14, color: "#8a9a5b" },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#9aa06a" }}>
                        {s.label}
                      </p>
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
                  { label: "VRAM", value: "12GB G6X" },
                  { label: "TDP", value: "220W" },
                  { label: "Cena", value: "~2 100 zł" },
                  { label: "Segment", value: "1440p Sweet spot" },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border p-3" style={{ background: "rgba(255,252,244,0.6)", borderColor: "rgba(72,60,50,0.1)" }}>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: "#9aa06a" }}>{s.label}</p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "#2d2a1e" }}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#9aa06a" }}>Ścieżka upgrade</p>
                <div className="mt-3 space-y-2">
                  {[
                    { name: "RTX 4080 Super", hint: "+38% wydajność", locked: false },
                    { name: "RTX 5070 Ti", hint: "Nowa generacja (est. Q3 2025)", locked: true },
                  ].map((u) => (
                    <div key={u.name} className="flex items-center gap-3 rounded-2xl border p-3" style={{ background: "rgba(255,252,244,0.6)", borderColor: "rgba(72,60,50,0.1)", opacity: u.locked ? 0.5 : 1 }}>
                      <span className="text-base">{u.locked ? "🔒" : "↗"}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#2d2a1e" }}>{u.name}</p>
                        <p className="text-[10px]" style={{ color: "#9aa06a" }}>{u.hint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border p-4" style={{ background: "rgba(224,229,198,0.5)", borderColor: "rgba(138,154,91,0.2)" }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: "#8a9a5b" }}>Werdykt Brata</p>
                <p className="mt-2 text-xs leading-5 italic" style={{ color: "#5a5240" }}>
                  &quot;Zestaw z 7600X ma świetny balans — procesor nie dusi karty, a zasilacz trzyma się w normie. Jedyne co warto rozważyć to mocniejszy PSU przy upgrade GPU.&quot;
                </p>
              </div>
            </div>
          </aside>
        </div>

        {/* ── MOBILE BOTTOM STRIP ── */}
        <div
          className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 lg:hidden"
          style={{
            background: "linear-gradient(to top, rgba(20,19,14,0.95) 0%, rgba(20,19,14,0) 100%)",
            paddingBottom: "env(safe-area-inset-bottom, 12px)",
          }}
        />
      </section>

      <PromptImportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="builder"
      />
    </>
  );
}
