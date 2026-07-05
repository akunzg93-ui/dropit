"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import StarsPromedio from "@/app/components/StarsPromedio";
import FlowGuideModal from "@/components/ui/FlowGuideModal";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  PackageCheck,
  ShieldAlert,
  X,
  ExternalLink,
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
    await fetch("/api/orders/rechazar-pedido", {
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="rounded-[28px] bg-white border border-slate-200 p-6 md:p-8 shadow-sm">
        <button
          onClick={() => router.push("/establecimiento")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition mb-6"
        >
          <ArrowLeft size={17} />
          Volver
        </button>

        <div className="grid md:grid-cols-[1.2fr_.8fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 mb-4">
              <PackageCheck size={15} />
              Validación de pedido
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e3a8a] leading-tight">
              Revisión de recepción
            </h1>

            <p className="mt-3 text-slate-600 text-sm md:text-base">
              Revisa el pedido y confirma si puedes recibirlo en tu
              establecimiento.
            </p>
          </div>

          <div className="rounded-3xl bg-blue-50 border border-blue-100 p-6">
            <p className="text-xs uppercase tracking-wide font-bold text-blue-600">
              Folio del pedido
            </p>

            <p className="mt-2 text-4xl md:text-5xl font-extrabold text-[#2563eb] tracking-tight">
              {pedido.folio}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold bg-amber-100 text-amber-700">
              <Clock3 size={16} />
              Pendiente de aprobación
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-[.9fr_1.1fr] gap-6">
        <div className="bg-gradient-to-r from-blue-700 to-blue-600 border border-blue-400 rounded-[28px] p-6 shadow-lg shadow-blue-100">
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

        <div className="flex gap-4 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-slate-700">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <ShieldAlert size={25} />
          </div>

          <div>
            <p className="font-bold text-amber-800 mb-1">
              Compromiso de recepción
            </p>
            <p className="text-sm md:text-base leading-relaxed">
              Al aceptar este pedido, te comprometes a recibir el paquete y
              resguardarlo hasta que el cliente lo recoja.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] shadow-sm border border-slate-200 p-6 md:p-8">
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
      </div>
    </div>

    {modalAceptado && (
      <FlowGuideModal
        title="¡Pedido aceptado!"
        subtitle="El vendedor ya puede llevar el paquete a tu establecimiento."
        heroLabel="Folio del pedido"
        heroValue={pedido.folio}
        onClose={() => setModalAceptado(false)}
        tip="Si por alguna razón el QR no está disponible, utiliza el código manual de recepción."
        steps={[
          {
            emoji: "📦",
            title: "Espera al vendedor",
            text: "Cuando llegue, pídele el QR o el código manual de recepción.",
          },
          {
            emoji: "📲",
            title: "Valida el paquete",
            text: "Escanea el QR o captura el código antes de recibir el paquete.",
          },
          {
            emoji: "🛡️",
            title: "Protege la entrega",
            text: "Nunca recibas paquetes sin validarlos desde Dropit.",
          },
          {
            emoji: "📧",
            title: "Avisamos al cliente",
            text: "Cuando confirmes la recepción, notificaremos automáticamente al cliente.",
          },
        ]}
        actions={[
          {
            label: "Ir al panel",
            icon: <ExternalLink size={18} />,
            onClick: () => router.push("/establecimiento/estado"),
            variant: "primary",
          },
        ]}
      />
    )}
  </div>
);
}