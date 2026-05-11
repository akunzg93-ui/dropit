"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import StarsPromedio from "@/app/components/StarsPromedio";

export default function AprobarPedido() {
  const { id } = useParams();
  const router = useRouter();

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    await fetch("/api/orders/aceptar-establecimiento", {
      method: "POST",
      body: JSON.stringify({ pedido_id: id }),
    });

    router.push("/establecimiento/estado");
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
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  }

  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* 🔵 HEADER */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-3xl p-8 shadow-xl">

          <p className="text-sm opacity-80">
            Validación de pedido
          </p>

          <h1 className="text-3xl font-bold mt-1">
            Revisión de recepción
          </h1>

          <p className="text-sm opacity-80 mt-2">
            Confirma si deseas aceptar este envío en tu establecimiento.
          </p>

        </div>
      </div>

      {/* 📦 CARD */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg border border-slate-200 p-8 space-y-8">

        {/* INFO */}
        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <p className="text-sm text-slate-500">
              Folio
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {pedido.folio}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Estado
            </p>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 mt-1">
              Pendiente de aprobación
            </span>
          </div>

        </div>

        {/* ⭐ EVALUACIÓN */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 border border-indigo-400 rounded-2xl p-5 shadow-lg">

          <p className="text-sm text-white/80 mb-2">
            Evaluación del vendedor
          </p>

          <StarsPromedio
            evaluado_id={pedido.vendedor_id}
            tipo="vendedor"
          />

        </div>

        {/* ⚠️ ALERTA */}
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-4 text-sm">
          ⚠️ Al aceptar este pedido, te comprometes a recibir el paquete y
          resguardarlo hasta que el cliente lo recoja.
        </div>

        {/* 🎯 BOTONES */}
        <div className="flex gap-4">

          <button
            onClick={aceptar}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.01] text-white py-3 rounded-2xl font-semibold transition shadow-lg"
          >
            Aceptar pedido
          </button>

          <button
            onClick={rechazar}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-2xl font-semibold transition border border-slate-200"
          >
            Rechazar
          </button>

        </div>

        {/* 🔙 VOLVER */}
        <button
          onClick={() => router.push("/establecimiento")}
          className="text-sm text-slate-500 hover:text-slate-700 transition"
        >
          ← Volver
        </button>

      </div>

    </div>
  );
}