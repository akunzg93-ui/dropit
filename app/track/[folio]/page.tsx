"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const ESTADOS = [
  "creado",
  "pendiente_aprobacion_establecimiento",
  "en_transito",
  "pendiente_recoleccion",
  "entregado",
];

const ESTADOS_LABEL: Record<string, string> = {
  creado: "Creado",
  pendiente_aprobacion_establecimiento: "Validando establecimiento",
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
  <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-12 pb-36">
    <div className="max-w-4xl mx-auto space-y-5 md:space-y-8">

      {/* BANNER ÉXITO PREMIUM */}
      {confirmed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-[28px] p-5 md:p-6 shadow-sm text-emerald-800">
          <p className="font-semibold text-base md:text-lg">
            ✅ Punto de entrega confirmado
          </p>

          <p className="text-sm mt-1">
            Ahora el establecimiento revisará tu pedido antes de que el vendedor reciba el código.
          </p>
        </div>
      )}

      {/* HEADER PEDIDO */}
      <div className="bg-white rounded-[28px] shadow-lg border border-slate-200 p-5 md:p-6">
        <h1 className="text-3xl md:text-2xl font-bold text-indigo-900 leading-tight break-words">
          Pedido {pedido.folio}
        </h1>

        <div className="mt-4 space-y-2 text-slate-600 text-sm md:text-base">

          <p className="break-words">
            <span className="font-semibold text-slate-800">
              Producto:
            </span>{" "}
            {pedido.producto}
          </p>

          <p className="break-words">
            <span className="font-semibold text-slate-800">
              Establecimiento:
            </span>{" "}
            {pedido.establecimiento_nombre || "Por definir"}
          </p>

        </div>
      </div>

      {/* STEPPER MOBILE-FIRST */}
      <div className="bg-white rounded-[28px] shadow-lg border border-slate-200 p-5 md:p-8 relative">

        {/* MOBILE */}
        <div className="md:hidden space-y-4">

          {ESTADOS.map((estado, index) => {
            const completado = index < estadoIndex;
            const actual = index === estadoIndex;

            return (
              <div
                key={estado}
                className="flex items-start gap-4"
              >

                {/* LINE */}
                <div className="flex flex-col items-center">

                  <div
                    className={`
                      w-9
                      h-9
                      rounded-full
                      flex
                      items-center
                      justify-center
                      text-xs
                      font-semibold
                      z-10
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

                  {index !== ESTADOS.length - 1 && (
                    <div className="w-[2px] h-10 bg-slate-200 mt-1" />
                  )}
                </div>

                {/* CONTENT */}
                <div className="pt-1 min-w-0">

                  <p
                    className={`
                      text-sm
                      font-medium
                      ${
                        actual
                          ? "text-indigo-700"
                          : "text-slate-700"
                      }
                    `}
                  >
                    {ESTADOS_LABEL[estado]}
                  </p>

                  {actual && (
                    <p className="text-xs text-slate-400 mt-1">
                      Estado actual
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* DESKTOP */}
        <div className="hidden md:block">

          <div className="absolute top-12 left-12 right-12 h-1 bg-slate-200 rounded-full" />

          <div className="relative flex justify-between">
            {ESTADOS.map((estado, index) => {
              const completado = index < estadoIndex;
              const actual = index === estadoIndex;

              return (
                <div
                  key={estado}
                  className="flex flex-col items-center flex-1"
                >
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
      </div>

      {/* ESTADO ACTUAL */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-[28px] p-5 md:p-6 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <p className="font-semibold text-indigo-900">
            Estado actual
          </p>

          <span className="inline-flex w-fit bg-indigo-600 text-white text-xs md:text-sm px-3 py-2 rounded-full">
            {ESTADOS_LABEL[pedido.estado] || pedido.estado}
          </span>
        </div>

        <p className="text-sm text-indigo-800 mt-3">
          Fecha de creación: {fechaCreacion}
        </p>

        {pedido.estado === "pendiente_aprobacion_establecimiento" && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
            ⏳ El establecimiento está revisando tu pedido. Te avisaremos en cuanto sea aceptado.
          </div>
        )}
      </div>

      {/* HISTORIAL */}
      <div className="bg-white rounded-[28px] shadow-lg border border-slate-200 p-5 md:p-6">

        <h3 className="font-semibold text-slate-800 mb-6">
          Historial del pedido
        </h3>

        {eventos.length === 0 ? (
          <p className="text-sm text-slate-600">
            Aún no hay eventos registrados.
          </p>
        ) : (
          <div className="relative pl-6 md:pl-8 space-y-6">

            <div className="absolute left-3 top-0 bottom-0 w-[2px] bg-slate-200 rounded-full" />

            {eventos.map((e: any, idx: number) => (
              <div key={idx} className="relative">

                <div className="absolute left-1 top-1 w-4 h-4 bg-indigo-600 rounded-full ring-4 ring-white shadow" />

                <div className="flex flex-col gap-1 ml-8">

                  <p className="font-medium text-slate-800 text-sm md:text-base">
                    {ESTADOS_LABEL[e.estado] ?? e.estado}
                  </p>

                  <p className="text-xs text-slate-500">
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