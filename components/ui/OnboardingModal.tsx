"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

type OnboardingModalProps = {
  title: string;
  subtitle: string;
  step: number;
  totalSteps: number;
  children: ReactNode;
  onSkip: () => void;
  onNext?: () => void;
  onBack?: () => void;
  onFinish?: () => void;
  nextLabel?: string;
  finishLabel?: string;
};

export default function OnboardingModal({
  title,
  subtitle,
  step,
  totalSteps,
  children,
  onSkip,
  onNext,
  onBack,
  onFinish,
  nextLabel = "Siguiente",
  finishLabel = "Ir al panel",
}: OnboardingModalProps) {
  const isFirstStep = step === 1;
  const isLastStep = step === totalSteps;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-slate-950/55 backdrop-blur-sm md:items-center md:px-4 md:py-8">
      <div className="relative w-full overflow-hidden rounded-t-[32px] border border-blue-100 bg-white shadow-2xl md:max-w-3xl md:rounded-[32px]">
        {/* HEADER */}
        <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 px-6 pb-8 pt-7 text-white md:px-9 md:pb-9 md:pt-8">
          <button
            type="button"
            onClick={onSkip}
            aria-label="Omitir introducción"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
          >
            <X size={20} />
          </button>

          <div className="pr-12">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                Introducción
              </span>

              <span className="text-sm font-semibold text-white/80">
                {step} de {totalSteps}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl">
              {title}
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 md:text-base">
              {subtitle}
            </p>
          </div>

          {/* PROGRESO */}
          <div className="mt-7 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const current = index + 1;

              return (
                <div
                  key={current}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    current <= step ? "bg-white" : "bg-white/25"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* CONTENIDO */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-7 md:max-h-[60vh] md:px-9 md:py-8">
          {children}
        </div>

        {/* ACCIONES */}
        <div className="border-t border-slate-100 bg-white px-6 py-5 md:px-9">
          <div className="flex items-center justify-between gap-3">
            <div>
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="h-12 rounded-2xl border-blue-100 px-5 font-bold text-[#1e3a8a]"
                >
                  <ArrowLeft size={18} />
                  Atrás
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSkip}
                className="px-2 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
              >
                Omitir
              </button>

              {!isLastStep ? (
                <Button
                  type="button"
                  onClick={onNext}
                  className="h-12 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] px-6 font-bold text-white shadow hover:shadow-lg"
                >
                  {nextLabel}
                  <ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onFinish}
                  className="h-12 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] px-6 font-bold text-white shadow hover:shadow-lg"
                >
                  {finishLabel}
                  <ArrowRight size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}