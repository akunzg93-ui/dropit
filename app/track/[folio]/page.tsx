"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const ESTADOS = [
  "creado",
  "en_transito",
  "pendiente_recoleccion",
  "entregado",
];

const ESTADOS_LABEL: Record<string, string> = {
  creado: "Creado",
  en_transito: "En tránsito",
  pendiente_recoleccion: "Pendiente de recolección",
  entregado: "Entregado",
};

export default function TrackPedidoPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const folio = params?.folio as string;
  const confirmed = searchParams.get("confirmed");

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔔 Notificación vendedor
  useEffect(() => {
    if (!folio || confirmed !== "1") return;

    fetch("/api/orders/notificar-vendedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folio }),
    }).catch(console.error);
  }, [folio, confirmed]);

  useEffect(() => {
    if (!folio) return;

    const fetchPedido = async () => {
      const { data, error } = await supabase.rpc(
        "get_pedido_tracking",
        { folio_param: folio }
      );

      if (error || !data || data.length === 0) {
        setError("Pedido no encontrado");
        setLoading(false);
        return;
      }

      setPedido(data[0]);
      setLoading(false);
    };

    fetchPedido();
  }, [folio]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-20 text-red-600 font-medium">
        {error}
      </div>
    );
  }

  if (!pedido) return null;

  const estadoIndex = ESTADOS.indexOf(pedido.estado);

  const fechaCreacion = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString()
    : "—";

  const eventos = Array.isArray(pedido.eventos)
    ? pedido.eventos
    : [];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* BANNER ÉXITO PREMIUM */}
        {confirmed && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 shadow-sm text-emerald-800">
            <p className="font-semibold text-lg">
              ✅ Punto de entrega confirmado
            </p>
            <p className="text-sm mt-1">
              Ahora puedes dar seguimiento en tiempo real a tu pedido.
            </p>
          </div>
        )}

        {/* HEADER PEDIDO */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-indigo-900">
            Pedido {pedido.folio}
          </h1>

          <div className="mt-3 space-y-1 text-slate-600">
            <p>
              <span className="font-medium text-slate-800">Producto:</span>{" "}
              {pedido.producto}
            </p>
            <p>
              <span className="font-medium text-slate-800">
                Establecimiento:
              </span>{" "}
              {pedido.establecimiento_nombre || "Por definir"}
            </p>
          </div>
        </div>

        {/* STEPPER PROFESIONAL */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 relative">
          <div className="absolute top-12 left-12 right-12 h-1 bg-slate-200 rounded-full" />

          <div className="relative flex justify-between">
            {ESTADOS.map((estado, index) => {
              const completado = index < estadoIndex;
              const actual = index === estadoIndex;

              return (
                <div key={estado} className="flex flex-col items-center w-1/4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                      ${
                        completado
                          ? "bg-emerald-500 text-white"
                          : actual
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-200"
                          : "bg-slate-300 text-slate-700"
                      }
                    `}
                  >
                    {index + 1}
                  </div>

                  <p className="text-xs mt-3 text-center">
                    {ESTADOS_LABEL[estado]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ESTADO ACTUAL */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-indigo-900">
              Estado actual
            </p>

            <span className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-full">
              {ESTADOS_LABEL[pedido.estado]}
            </span>
          </div>

          <p className="text-sm text-indigo-800 mt-2">
            Fecha de creación: {fechaCreacion}
          </p>
        </div>

        {/* HISTORIAL TIMELINE */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-6">
            Historial del pedido
          </h3>

          {eventos.length === 0 ? (
            <p className="text-sm text-slate-600">
              Aún no hay eventos registrados.
            </p>
          ) : (
            <div className="relative pl-8 space-y-8">
  <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-slate-200 rounded-full" />

  {eventos.map((e: any, idx: number) => (
    <div key={idx} className="relative">
      <div className="absolute left-1 top-1 w-4 h-4 bg-indigo-600 rounded-full ring-4 ring-white shadow" />

      <div className="flex justify-between items-start ml-8">
        <div>
          <p className="font-medium text-slate-800">
            {ESTADOS_LABEL[e.estado] ?? e.estado}
          </p>
        </div>

        <p className="text-sm text-slate-500 whitespace-nowrap">
          {e.fecha
            ? new Date(e.fecha).toLocaleString()
            : "—"}
        </p>
      </div>
    </div>
  ))}
</div>
          )}
        </div>

      </div>
    </div>
  );
}