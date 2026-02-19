"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
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
        <Loader2 className="animate-spin w-6 h-6" />
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
    <div className="max-w-3xl mx-auto mt-10 px-4 space-y-6">

      {/* ✅ MENSAJE DE CONFIRMACIÓN */}
      {confirmed && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✅ Confirmaste correctamente tu punto de entrega.
          <br />
          Aquí podrás dar seguimiento en tiempo real a tu pedido.
        </div>
      )}

      {/* HEADER */}
      <Card>
        <CardContent className="p-4">
          <h1 className="text-xl font-semibold">
            Pedido {pedido.folio}
          </h1>
          <p className="text-gray-600">
            Producto: {pedido.producto}
          </p>
          <p className="text-gray-600">
            Establecimiento:{" "}
            {pedido.establecimiento_nombre || "Por definir"}
          </p>
        </CardContent>
      </Card>

      {/* STEPPER */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between">
            {ESTADOS.map((estado, index) => {
              const activo = index <= estadoIndex;
              const actual = index === estadoIndex;

              return (
                <div key={estado} className="flex-1 text-center">
                  <div
                    className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                      ${activo ? "bg-blue-600 text-white" : "bg-gray-300"}
                      ${actual ? "ring-4 ring-blue-200" : ""}
                    `}
                  >
                    {index + 1}
                  </div>
                  <p className="text-xs mt-2">
                    {ESTADOS_LABEL[estado]}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ESTADO ACTUAL */}
      <Card>
        <CardContent className="p-4 space-y-1">
          <p className="font-medium">
            Estado actual: {ESTADOS_LABEL[pedido.estado]}
          </p>
          <p className="text-sm text-gray-600">
            Fecha de creación: {fechaCreacion}
          </p>
        </CardContent>
      </Card>

      {/* HISTORIAL */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">
            Historial del pedido
          </h3>

          {eventos.length === 0 ? (
            <p className="text-sm text-gray-600">
              Aún no hay eventos registrados.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {eventos.map((e: any, idx: number) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    {ESTADOS_LABEL[e.estado] ?? e.estado}
                  </span>
                  <span className="text-gray-500">
                    {e.fecha
                      ? new Date(e.fecha).toLocaleString()
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
