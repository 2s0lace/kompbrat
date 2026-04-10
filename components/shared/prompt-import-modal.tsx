"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils/cn";

type PromptImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "builder" | "checker";
};

const examplePrompts = {
  builder: [
    "PC do gier za 3000 zł, bez RGB, najlepiej pod 1080p.",
    "Zestaw do pracy i montażu do 2500 zł, ważna cisza.",
    "Co kupić używanego za około 2700 zł, żeby nie wtopić?",
  ],
  checker: [
    "Ryzen 5 5600, RTX 3060, 16 GB RAM, 1 TB SSD — 2800 zł OLX.",
    "Komputer do gier i7-12700, RTX 3070, brak gwarancji — 4200 zł.",
    "PC biurowy, Core i5-10400, 8 GB RAM, 499 zł Allegro.",
  ],
};

const labels = {
  builder: {
    title: "Opisz, czego szukasz",
    sub: "Powiedz Bratowi budżet, zastosowanie i preferencje.",
    placeholder: "np. PC do gier za 3500 zł, grywam głównie w FPS, bez RGB, chcę cicho...",
    cta: "Dobierz komputer",
  },
  checker: {
    title: "Wklej ofertę do sprawdzenia",
    sub: "Wrzuć tytuł, cenę i opis. Brat oceni ofertę i wyłapie red flagi.",
    placeholder: "np. Ryzen 5 5600, RTX 3060, 16 GB RAM, 2800 zł OLX Warszawa, brak gwarancji...",
    cta: "Sprawdź ofertę",
  },
};

export function PromptImportModal({ isOpen, onClose, mode }: PromptImportModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const copy = labels[mode];
  const prompts = examplePrompts[mode];

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      role="dialog"
      aria-modal
      aria-label="Wpisz prompt"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

      {/* Sheet */}
      <div
        className={cn(
          "relative z-10 w-full max-w-xl rounded-t-[28px] sm:rounded-[28px]",
          "border border-border/50 shadow-2xl",
          "animate-fade-up"
        )}
        style={{
          background: "linear-gradient(160deg, #1c1b12 0%, #14130e 100%)",
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/10 sm:hidden" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: "#8a9a5b" }}
              >
                {mode === "builder" ? "Builder KOMPBRAT" : "KOMPBRAT Checker"}
              </p>
              <h2
                className="mt-2 font-serif text-2xl leading-tight sm:text-3xl"
                style={{ color: "#e8e4d0" }}
              >
                {copy.title}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "rgba(200,195,170,0.55)" }}>
                {copy.sub}
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10"
              style={{ color: "rgba(200,195,170,0.5)" }}
              aria-label="Zamknij"
            >
              ✕
            </button>
          </div>

          {/* ── LOCKED CONTENT ── */}
          <div className="relative mt-6">
            {/* Textarea + prompts — dimmed */}
            <div className="pointer-events-none select-none opacity-35">
              <textarea
                disabled
                placeholder={copy.placeholder}
                rows={4}
                className="w-full resize-none rounded-2xl border px-4 py-3 text-sm"
                style={{
                  background: "rgba(255,252,244,0.06)",
                  borderColor: "rgba(138,154,91,0.2)",
                  color: "#e8e4d0",
                }}
              />

              <div className="mt-3 space-y-2">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "rgba(138,154,91,0.7)" }}
                >
                  Przykładowe prompty
                </p>
                {prompts.map((p) => (
                  <div
                    key={p}
                    className="rounded-xl border px-3 py-2.5 text-xs"
                    style={{
                      borderColor: "rgba(138,154,91,0.15)",
                      background: "rgba(255,252,244,0.04)",
                      color: "rgba(200,195,170,0.6)",
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>

              <button
                disabled
                className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold uppercase tracking-widest"
                style={{ background: "#8a9a5b", color: "#1c1b12" }}
              >
                {copy.cta}
              </button>
            </div>

            {/* ── LOCK OVERLAY ── */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{
                  width: 52,
                  height: 52,
                  background: "rgba(138,154,91,0.12)",
                  border: "1px solid rgba(138,154,91,0.25)",
                }}
              >
                <span className="text-2xl">🔒</span>
              </div>
              <div className="text-center">
                <p
                  className="font-serif text-xl font-semibold"
                  style={{ color: "#e8e4d0" }}
                >
                  Wkrótce dostępne
                </p>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "rgba(200,195,170,0.5)" }}
                >
                  Funkcja jest w budowie. Wróć niebawem.
                </p>
              </div>
              <div
                className="mt-1 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{
                  borderColor: "rgba(138,154,91,0.3)",
                  color: "#8a9a5b",
                  background: "rgba(138,154,91,0.08)",
                }}
              >
                W budowie
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
