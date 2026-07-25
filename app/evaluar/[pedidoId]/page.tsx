"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type PedidoEvaluacion = {
  id: number;
  folio: string;
  vendedor_id?: string | null;
  comprador_id?: string | null;
  establecimiento_uuid?: string | null;
};

type TipoEvaluador = "comprador" | "vendedor";

export default function EvaluarPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const tipoParametro = searchParams.get("tipo");

  const tipoEvaluador: TipoEvaluador =
    tipoParametro === "vendedor" ? "vendedor" : "comprador";

  const esVendedor = tipoEvaluador === "vendedor";

  const [pedido, setPedido] = useState<PedidoEvaluacion | null>(null);

  const [ratingVendedor, setRatingVendedor] = useState(0);
  const [ratingEstablecimiento, setRatingEstablecimiento] =
    useState(0);

  const [comentario, setComentario] = useState("");

  const [cargandoPedido, setCargandoPedido] = useState(true);
  const [loading, setLoading] = useState(false);

  const [errorCarga, setErrorCarga] = useState("");
  const [errorEnvio, setErrorEnvio] = useState("");

  const [success, setSuccess] = useState(false);

  const pedidoId = Number(params.pedidoId);

  const loadPedido = useCallback(async () => {
    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
      setErrorCarga("El enlace de evaluación no es válido.");
      setCargandoPedido(false);
      return;
    }

    try {
      setCargandoPedido(true);
      setErrorCarga("");

      const response = await fetch("/api/orders/get", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.id) {
        throw new Error(
          data?.error || "No se pudo cargar el pedido"
        );
      }

      setPedido(data);
    } catch (error) {
      console.error("Error cargando pedido:", error);
      setErrorCarga("No se pudo cargar la información del pedido.");
    } finally {
      setCargandoPedido(false);
    }
  }, [pedidoId]);

  useEffect(() => {
    void loadPedido();
  }, [loadPedido]);

  async function enviarUnaEvaluacion({
    rating,
    tipoEvaluado,
  }: {
    rating: number;
    tipoEvaluado: "vendedor" | "establecimiento";
  }) {
    const response = await fetch(
      "/api/orders/evaluaciones/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: pedido?.id,
          rating,
          comentario: comentario.trim() || null,
          tipo_evaluador: tipoEvaluador,
          tipo_evaluado: tipoEvaluado,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.detail ||
          data?.error ||
          "No se pudo enviar la evaluación"
      );
    }
  }

  async function enviarEvaluacion() {
    if (!pedido || success || loading) return;

    if (esVendedor) {
      if (ratingEstablecimiento === 0) {
        setErrorEnvio(
          "Selecciona una calificación para el establecimiento."
        );
        return;
      }
    } else if (
      ratingVendedor === 0 ||
      ratingEstablecimiento === 0
    ) {
      setErrorEnvio(
        "Selecciona una calificación para el vendedor y el establecimiento."
      );
      return;
    }

    setLoading(true);
    setErrorEnvio("");

    try {
      if (esVendedor) {
        await enviarUnaEvaluacion({
          rating: ratingEstablecimiento,
          tipoEvaluado: "establecimiento",
        });
      } else {
        await enviarUnaEvaluacion({
          rating: ratingVendedor,
          tipoEvaluado: "vendedor",
        });

        await enviarUnaEvaluacion({
          rating: ratingEstablecimiento,
          tipoEvaluado: "establecimiento",
        });
      }

      setSuccess(true);
    } catch (error) {
      console.error("Error enviando evaluación:", error);

      setErrorEnvio(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la evaluación."
      );
    } finally {
      setLoading(false);
    }
  }

  function renderStars(
    value: number,
    setValue: (value: number) => void
  ) {
    return (
      <div className="mb-2 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((numero) => (
          <button
            key={numero}
            type="button"
            onClick={() => setValue(numero)}
            disabled={success || loading}
            aria-label={`Calificar con ${numero} estrellas`}
            className={`cursor-pointer text-4xl transition hover:scale-110 disabled:cursor-default ${
              numero <= value
                ? "text-amber-400"
                : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  }

  if (cargandoPedido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-slate-600 shadow-sm">
          Cargando evaluación...
        </div>
      </div>
    );
  }

  if (errorCarga || !pedido) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <div className="text-4xl">⚠️</div>

          <h1 className="mt-4 text-xl font-bold text-red-700">
            No se pudo abrir la evaluación
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {errorCarga || "Pedido no encontrado."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] px-6 py-8 text-center text-white shadow-lg">
          <div className="text-4xl">⭐</div>

          <h1 className="mt-3 text-2xl font-bold">
            ¿Cómo fue tu experiencia?
          </h1>

          <p className="mt-2 text-sm text-blue-100">
            Pedido {pedido.folio}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-md">
          {success ? (
            <div className="py-8 text-center">
              <div className="text-6xl">✅</div>

              <h2 className="mt-5 text-2xl font-bold text-emerald-700">
                ¡Gracias por tu evaluación!
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Tu opinión fue registrada correctamente y nos ayuda a
                mejorar la experiencia de Dropit.
              </p>
            </div>
          ) : (
            <>
              {!esVendedor && (
                <section>
                  <p className="text-center text-lg font-semibold text-slate-800">
                    Vendedor
                  </p>

                  <p className="mb-3 mt-1 text-center text-sm text-slate-500">
                    Califica tu experiencia con el vendedor.
                  </p>

                  {renderStars(
                    ratingVendedor,
                    setRatingVendedor
                  )}
                </section>
              )}

              <section className={esVendedor ? "" : "mt-7"}>
                <p className="text-center text-lg font-semibold text-slate-800">
                  Establecimiento
                </p>

                <p className="mb-3 mt-1 text-center text-sm text-slate-500">
                  {esVendedor
                    ? "Califica la atención y el servicio del establecimiento."
                    : "Califica tu experiencia en el punto de entrega."}
                </p>

                {renderStars(
                  ratingEstablecimiento,
                  setRatingEstablecimiento
                )}
              </section>

              <textarea
                className="mt-6 min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Cuéntanos tu experiencia (opcional)..."
                value={comentario}
                maxLength={500}
                onChange={(event) =>
                  setComentario(event.target.value)
                }
              />

              {errorEnvio && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
                  {errorEnvio}
                </div>
              )}

              <button
                type="button"
                onClick={enviarEvaluacion}
                disabled={loading}
                className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white shadow transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Enviando evaluación..."
                  : "Enviar evaluación"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}