"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";

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

      {/* 🔵 HEADER PRO */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-sm opacity-80">Validación de pedido</p>
          <h1 className="text-2xl font-bold">Revisión de recepción</h1>
          <p className="text-sm opacity-80 mt-1">
            Confirma si deseas aceptar este envío en tu establecimiento.
          </p>
        </div>
      </div>

      {/* 📦 CARD PRINCIPAL */}
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">

        {/* INFO */}
        <div className="grid md:grid-cols-2 gap-6">

          <div>
            <p className="text-sm text-gray-500">Folio</p>
            <p className="text-lg font-semibold">{pedido.folio}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <span className="inline-block px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
              Pendiente de aprobación
            </span>
          </div>

        </div>

        {/* ⚠️ ALERTA */}
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-4 text-sm">
          ⚠️ Al aceptar este pedido, te comprometes a recibir el paquete y
          resguardarlo hasta que el cliente lo recoja.
        </div>

        {/* 🎯 BOTONES */}
        <div className="flex gap-4">

          <button
            onClick={aceptar}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition"
          >
            Aceptar pedido
          </button>

          <button
            onClick={rechazar}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition"
          >
            Rechazar
          </button>

        </div>

        {/* 🔙 VOLVER */}
        <button
          onClick={() => router.push("/establecimiento")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Volver
        </button>

      </div>

    </div>
  );
}