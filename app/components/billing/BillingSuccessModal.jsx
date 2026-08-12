"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function BillingSuccessModal({
  open,
  onAccept,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-5"
      onClick={onAccept}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle size={30} />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Facturación
        </p>

        <h2 className="mt-2 text-2xl font-bold text-[#1e3a8a]">
          Solicitud enviada correctamente
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          Recibimos tu solicitud de factura. Podrás consultar el avance
          desde la sección de Facturación de este pedido.
        </p>

        <Button
          className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white"
          onClick={onAccept}
        >
          Aceptar
        </Button>
      </div>
    </div>
  );
}