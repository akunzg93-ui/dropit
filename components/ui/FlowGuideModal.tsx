"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, X } from "lucide-react";

type Step = {
  emoji: string;
  title: string;
  text: string;
};

type Action = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline" | "success";
};

export default function FlowGuideModal({
  title,
  subtitle,
  heroLabel = "Folio del pedido",
  heroValue,
  steps,
  tip,
  feedback,
  actions,
  onClose,
  onCopyHeroValue,
}: {
  title: string;
  subtitle: string;
  heroLabel?: string;
  heroValue: string;
  steps: Step[];
  tip: string;
  feedback?: string;
  actions: Action[];
  onClose: () => void;
  onCopyHeroValue?: () => void;
}) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-slate-950/55 backdrop-blur-sm flex items-center justify-center px-4 py-8"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-[32px] border border-blue-100 bg-white shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 h-11 w-11 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
        >
          <X size={22} />
        </button>

        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-8 md:p-10 text-white">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-6 items-center pr-10">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-full bg-white/15 border-4 border-white/40 flex items-center justify-center shadow-lg animate-pulse">
                <CheckCircle2 size={56} className="text-white" />
              </div>

              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold leading-tight text-white">
                  {title}
                </h2>

                <p className="mt-3 text-white/90">{subtitle}</p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/95 border border-white/40 p-6 text-center text-blue-700 shadow-xl">
              <p className="text-sm uppercase tracking-wide font-bold">
                {heroLabel}
              </p>

              <div className="mt-2 flex items-center justify-center gap-3">
                <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  {heroValue}
                </p>

                {onCopyHeroValue && (
                  <button
                    type="button"
                    onClick={onCopyHeroValue}
                    className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition"
                  >
                    <Copy size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-7">
          {feedback && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              {feedback}
            </div>
          )}

          <div>
            <h3 className="text-2xl font-extrabold text-center text-[#1e3a8a]">
              ¿Qué sigue ahora? 
            </h3>

            <div
              className={`mt-7 grid gap-5 ${
                steps.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
              }`}
            >
              {steps.map((step) => (
                <div key={step.title} className="text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-4xl shadow-sm">
                    {step.emoji}
                  </div>

                  <p className="mt-3 font-bold text-[#1e3a8a]">
                    {step.title}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 text-center text-sm text-blue-800">
            💡 <span className="font-bold">Tip:</span> {tip}
          </div>

          <div
            className={`grid gap-3 ${
              actions.length === 2
                ? "md:grid-cols-2"
                : actions.length === 3
                ? "md:grid-cols-3"
                : "md:grid-cols-4"
            }`}
          >
            {actions.map((action) => (
              <Button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                variant={
                  action.variant === "primary" || action.variant === "success"
                    ? "default"
                    : "outline"
                }
                className={`h-14 rounded-2xl font-bold flex items-center gap-2 ${
                  action.variant === "primary"
                    ? "bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow hover:shadow-lg"
                    : action.variant === "success"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-blue-100"
                }`}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}