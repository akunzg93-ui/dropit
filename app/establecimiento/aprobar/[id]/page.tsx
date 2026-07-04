"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import StarsPromedio from "@/app/components/StarsPromedio";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  PackageCheck,
  ShieldAlert,
  X,
  QrCode,
  KeyRound,
} from "lucide-react";

export default function AprobarPedido() {
  const { id } = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aceptando, setAceptando] = useState(false);
  const [modalAceptado, setModalAceptado] = useState(false);

  useEffect(() => {
    async function fetchPedido() {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", id)
        .single();

      if (!error) setPedido(data);

      setLoading(false);
    }

    fetchPedido();
  }, [id]);

  async function aceptar() {
    setAceptando(true);

    await fetch("/api/orders/aceptar-establecimiento", {
      method: "POST",
      body: JSON.stringify({ pedido_id: id }),
    });

    setAceptando(false);
    setModalAceptado(true);
  }

  async function rechazar() {
    await fetch("/api/orders/rechazar-establecimiento", {
      method: "POST",
      body: JSON.stringify({ pedido_id: id }),
    });

    router.push("/establecimiento/estado");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-3xl px-8 py-6 shadow-sm text-slate-600">
          Cargando pedido...
        </div>
      </div>
    );
  }

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-[#f6f9fc] px-4 py-8 md:py-10">
      <div className="max-w-5xl mx-auto space-y-7">
        {/* HEADER */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-8 md:p-10 shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/90 mb-4">
              <PackageCheck size={15} />
              Validación de pedido
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              Revisión de recepción
            </h1>

            <p className="mt-3 text-white/90 text-sm md:text-base">
              Confirma si deseas aceptar este envío en tu establecimiento.
            </p>
          </div>

          <div className="hidden md:flex absolute right-10 top-1/2 -translate-y-1/2 items-center justify-center">
            <div className="w-36 h-36 rounded-[32px] bg-white/15 border border-white/20 flex items-center justify-center rotate-6">
              <CheckCircle2 size={72} className="text-white" />
            </div>
          </div>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/70 border border-slate-200 p-6 md:p-8 space-y-7">
          {/* INFO */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={30} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Folio</p>
                <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
                  {pedido.folio}
                </p>
              </div>
            </div>

            <div className="md:border-l md:border-slate-200 md:pl-8 flex items-center">
              <div>
                <p className="text-sm text-slate-500 mb-2">Estado</p>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
                  <Clock3 size={16} />
                  Pendiente de aprobación
                </span>
              </div>
            </div>
          </div>

          {/* EVALUACIÓN */}
          <div className="bg-gradient-to-r from-blue-700 to-blue-600 border border-blue-400 rounded-3xl p-6 shadow-lg shadow-blue-100">
            <p className="text-sm text-white/85 mb-3 font-medium">
              Evaluación del vendedor
            </p>

            <div className="text-white">
              <StarsPromedio
                evaluado_id={pedido.vendedor_id}
                tipo="vendedor"
              />
            </div>
          </div>

          {/* ALERTA */}
          <div className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-slate-700">
            <div className="shrink-0 w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>

            <p className="text-sm md:text-base leading-relaxed">
              Al aceptar este pedido, te comprometes a recibir el paquete y
              resguardarlo hasta que el cliente lo recoja.
            </p>
          </div>

          {/* BOTONES */}
          <div className="grid md:grid-cols-2 gap-4">
            <button
              onClick={aceptar}
              disabled={aceptando}
              className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:scale-[1.01] disabled:opacity-70 disabled:hover:scale-100 text-white py-4 rounded-2xl font-bold transition shadow-lg shadow-blue-200"
            >
              <CheckCircle2 size={21} />
              {aceptando ? "Aceptando..." : "Aceptar pedido"}
            </button>

            <button
              onClick={rechazar}
              className="flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 py-4 rounded-2xl font-bold transition border border-slate-300"
            >
              <X size={21} />
              Rechazar
            </button>
          </div>

          {/* VOLVER */}
          <button
            onClick={() => router.push("/establecimiento")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <ArrowLeft size={17} />
            Volver
          </button>
        </div>
      </div>

      {/* MODAL ACEPTADO */}
      {modalAceptado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg bg-white rounded-[28px] shadow-2xl border border-slate-200 p-6 md:p-7">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900">
              Pedido aceptado
            </h2>

            <p className="mt-2 text-slate-600 leading-relaxed">
              Ahora espera a que el vendedor acuda a tu establecimiento para
              entregar el paquete.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <QrCode className="text-blue-600 shrink-0" size={22} />
                <p className="text-sm text-slate-700">
                  Cuando llegue, pídele que muestre el QR del pedido.
                </p>
              </div>

              <div className="flex gap-3 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <KeyRound className="text-blue-600 shrink-0" size={22} />
                <p className="text-sm text-slate-700">
                  Si no puede mostrar el QR, solicita el código manual de
                  recepción.
                </p>
              </div>

              <div className="flex gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <ShieldAlert className="text-amber-600 shrink-0" size={22} />
                <p className="text-sm text-slate-700">
                  No recibas paquetes sin validar el QR o código dentro de
                  Dropit.
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/establecimiento/estado")}
              className="mt-6 w-full bg-gradient-to-r from-blue-700 to-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.01] transition"
            >
              Entendido, ir al panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}