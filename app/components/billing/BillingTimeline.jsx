"use client";

import { CheckCircle } from "lucide-react";

export default function BillingTimeline({
  disponible = "active",
  solicitud = "pending",
  facturaDropit = "pending",
  facturaEstablecimiento = "pending",
  finalizado = "pending",
}) {
  return (
    <div className="mt-5">
      <BillingStep
        label="Disponible"
        status={disponible}
        first
      />

      <BillingStep
        label="Solicitud enviada"
        status={solicitud}
      />

      <BillingStep
        label="Factura Dropit"
        status={facturaDropit}
      />

      <BillingStep
        label="Factura establecimiento"
        status={facturaEstablecimiento}
      />

      <BillingStep
        label="Finalizado"
        status={finalizado}
        last
      />
    </div>
  );
}

function BillingStep({
  label,
  status,
  first = false,
  last = false,
}) {
  const completed = status === "completed";
  const active = status === "active";

  return (
    <div className="flex gap-3">
      <div className="flex w-5 flex-col items-center">
        {!first && (
          <div
            className={`h-3 w-px ${
              completed
                ? "bg-emerald-400"
                : "bg-slate-200"
            }`}
          />
        )}

        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            completed
              ? "border-emerald-500 bg-emerald-500 text-white"
              : active
              ? "border-emerald-500 bg-emerald-500"
              : "border-slate-300 bg-white"
          }`}
        >
          {completed && <CheckCircle size={13} />}
        </div>

        {!last && (
          <div
            className={`min-h-5 w-px flex-1 ${
              completed
                ? "bg-emerald-400"
                : "bg-slate-200"
            }`}
          />
        )}
      </div>

      <div className={last ? "pb-0" : "pb-4"}>
        <p
          className={`text-sm font-semibold ${
            completed || active
              ? "text-emerald-700"
              : "text-slate-400"
          }`}
        >
          {label}
        </p>
      </div>
    </div>
  );
}