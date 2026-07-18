"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type PedidoPreview = {
  id: string;
  folio: string;
  producto: string;
  establecimiento_nombre: string;
};

type ModoEntrega = "cliente" | "devolucion";

export default function EntregarPedidoPage() {
  const [modo, setModo] = useState<ModoEntrega>("cliente");

  const [folio, setFolio] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const [scannerActivo, setScannerActivo] = useState(false);
  const [pedido, setPedido] = useState<PedidoPreview | null>(null);

  const [showEvaluation, setShowEvaluation] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);

  const [rating, setRating] = useState(5);
  const [comentario, setComentario] = useState("");
  const [successEval, setSuccessEval] = useState(false);
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [sendingEval, setSendingEval] = useState(false);

  const pedidoEntregadoRef = useRef<PedidoPreview | null>(null);
  const qrInstance = useRef<Html5Qrcode | null>(null);

  const esDevolucion = modo === "devolucion";

  const limpiarFormulario = () => {
    setPedido(null);
    setFolio("");
    setCodigo("");
    setMensaje("");
  };

  const cambiarModo = async (nuevoModo: ModoEntrega) => {
    if (scannerActivo) {
      await detenerScanner();
    }

    setModo(nuevoModo);
    limpiarFormulario();
  };

  const iniciarScanner = async () => {
    setMensaje("");

    if (!qrInstance.current) {
      qrInstance.current = new Html5Qrcode("qr-reader");
    }

    try {
      const cameras = await Html5Qrcode.getCameras();

      if (!cameras || cameras.length === 0) {
        setMensaje("No se encontraron cámaras");
        return;
      }

      const scanner = qrInstance.current;

      if (!scanner) {
        setMensaje("Scanner no inicializado");
        return;
      }

      const cameraId =
        cameras.find((camera) =>
          camera.label.toLowerCase().includes("back")
        )?.id || cameras[0].id;

      await scanner.start(
        cameraId,
        {
          fps: 10,
          qrbox: 260,
        },
        (decodedText: string) => {
          if (!decodedText.includes("|")) {
            setMensaje("QR inválido");
            return;
          }

          const [folioQr, codigoQr] = decodedText.split("|");

          if (!folioQr || !codigoQr) {
            setMensaje("QR inválido");
            return;
          }

          setFolio(folioQr.trim().toUpperCase());
          setCodigo(codigoQr.trim());

          void detenerScanner();
        },
        () => {}
      );

      setScannerActivo(true);
    } catch (error) {
      console.error("Error accediendo a la cámara:", error);
      setMensaje("No se pudo acceder a la cámara");
    }
  };

  const detenerScanner = async () => {
    try {
      if (qrInstance.current) {
        const scannerState = qrInstance.current.getState();

        if (scannerState === 2 || scannerState === 3) {
          await qrInstance.current.stop();
        }

        await qrInstance.current.clear();
      }
    } catch (error) {
      console.error("Error deteniendo el scanner:", error);
    } finally {
      setScannerActivo(false);
    }
  };

  const consultarPedido = async () => {
    const folioLimpio = folio.trim().toUpperCase();
    const codigoLimpio = codigo.trim();

    if (!folioLimpio || !codigoLimpio) {
      setMensaje(
        esDevolucion
          ? "Ingresa el folio y código de devolución"
          : "Ingresa el folio y código de entrega"
      );
      return;
    }

    setLoading(true);
    setMensaje("");

    try {
      const endpoint = esDevolucion
        ? "/api/orders/devoluciones/preview"
        : "/api/orders/preview";

      const body = esDevolucion
        ? {
            folio: folioLimpio,
            codigo_devolucion: codigoLimpio,
          }
        : {
            folio: folioLimpio,
            codigo_entrega: codigoLimpio,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(
          data.error ||
            (esDevolucion
              ? "No se pudo validar la devolución"
              : "No se pudo validar el pedido")
        );
        return;
      }

      setPedido(data.pedido);
      setFolio(folioLimpio);
      setCodigo(codigoLimpio);
    } catch (error) {
      console.error("Error consultando pedido:", error);
      setMensaje("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntrega = async () => {
    if (!pedido) return;

    setLoading(true);
    setMensaje("");

    try {
      const endpoint = esDevolucion
        ? "/api/orders/devoluciones/completar"
        : "/api/orders/entregado";

      const body = esDevolucion
        ? {
            folio: folio.trim().toUpperCase(),
            codigo_devolucion: codigo.trim(),
          }
        : {
            folio: folio.trim().toUpperCase(),
            codigo_entrega: codigo.trim(),
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(
          data.error ||
            (esDevolucion
              ? "Error al entregar la devolución"
              : "Error al entregar el pedido")
        );
        return;
      }

      pedidoEntregadoRef.current = pedido;

      setShowDelivered(true);
      setPedido(null);
      setFolio("");
      setCodigo("");

      if (esDevolucion) {
        setTimeout(() => {
          setShowDelivered(false);
          pedidoEntregadoRef.current = null;
        }, 2200);

        return;
      }

      setTimeout(() => {
        setShowDelivered(false);
        setShowEvaluation(true);
      }, 1800);
    } catch (error) {
      console.error("Error confirmando entrega:", error);
      setMensaje("Error de red");
    } finally {
      setLoading(false);
    }
  };

  const enviarEvaluacion = async () => {
    try {
      setSendingEval(true);

      const comentarioFinal = [...quickTags, comentario]
        .filter(Boolean)
        .join(" • ");

      const response = await fetch(
        "/api/orders/evaluaciones/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pedido_id: pedidoEntregadoRef.current?.id,
            rating,
            comentario: comentarioFinal,
            tipo_evaluador: "establecimiento",
            tipo_evaluado: "vendedor",
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo enviar la evaluación");
      }

      setSuccessEval(true);

      setTimeout(() => {
        setShowEvaluation(false);
        setSuccessEval(false);
        pedidoEntregadoRef.current = null;
        setComentario("");
        setQuickTags([]);
        setRating(5);
      }, 1800);
    } catch (error) {
      console.error("Error enviando evaluación:", error);
    } finally {
      setSendingEval(false);
    }
  };

  useEffect(() => {
    return () => {
      void detenerScanner();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      {showDelivered && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
                esDevolucion ? "bg-orange-50" : "bg-blue-50"
              }`}
            >
              {esDevolucion ? "↩️" : "✅"}
            </div>

            <div>
              <h2
                className={`text-2xl font-bold ${
                  esDevolucion
                    ? "text-orange-700"
                    : "text-[#1e3a8a]"
                }`}
              >
                {esDevolucion
                  ? "Devolución entregada"
                  : "Pedido entregado"}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {esDevolucion
                  ? "El vendedor recuperó el paquete y la devolución fue completada correctamente."
                  : "La entrega final del paquete fue registrada correctamente."}
              </p>
            </div>
          </div>
        </div>
      )}

      {showEvaluation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowEvaluation(false)}
              className="absolute right-4 top-4 h-10 w-10 rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-4xl">
                ⭐
              </div>

              <h2 className="mt-4 text-2xl font-bold text-[#1e3a8a]">
                ¿Cómo fue tu experiencia?
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Tu evaluación ayuda a mejorar la calidad de Dropit.
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((numero) => (
                <button
                  key={numero}
                  type="button"
                  onClick={() => setRating(numero)}
                  className={`transition-all duration-200 hover:scale-110 ${
                    numero <= rating
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                >
                  <span className="text-5xl">★</span>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Excelente servicio",
                "Muy rápido",
                "Buena atención",
                "Muy amable",
                "Entrega segura",
              ].map((tag) => {
                const active = quickTags.includes(tag);

                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      if (active) {
                        setQuickTags(
                          quickTags.filter(
                            (quickTag) => quickTag !== tag
                          )
                        );
                      } else {
                        setQuickTags([...quickTags, tag]);
                      }
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? "border-[#2563eb] bg-[#2563eb] text-white"
                        : "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {successEval && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="text-4xl">✅</div>

                <p className="mt-2 font-semibold text-emerald-700">
                  ¡Gracias por tu evaluación!
                </p>
              </div>
            )}

            <textarea
              value={comentario}
              onChange={(event) =>
                setComentario(event.target.value)
              }
              placeholder="Comentario opcional..."
              className="min-h-[110px] w-full rounded-2xl border border-slate-200 p-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={enviarEvaluacion}
              disabled={sendingEval}
              className="h-12 w-full rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] font-semibold text-white shadow transition hover:shadow-lg disabled:opacity-70"
            >
              {sendingEval
                ? "Enviando..."
                : "Enviar evaluación"}
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Logística fácil y sin dramas
            </p>

            <h1
              className={`mt-3 text-4xl font-bold leading-tight md:text-5xl ${
                esDevolucion
                  ? "text-orange-700"
                  : "text-[#1e3a8a]"
              }`}
            >
              {esDevolucion
                ? "Entrega de devolución ↩️"
                : "Entrega de pedido 📦"}
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              {esDevolucion
                ? "Escanea el QR o ingresa el código de devolución del vendedor para confirmar que recuperó el paquete."
                : "Escanea el QR del cliente o ingresa el código manual para confirmar la entrega final del paquete."}
            </p>
          </div>
        </section>

        <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
            <button
              type="button"
              onClick={() => void cambiarModo("cliente")}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition md:px-4 ${
                modo === "cliente"
                  ? "bg-white text-[#1e3a8a] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Entrega al cliente
            </button>

            <button
              type="button"
              onClick={() => void cambiarModo("devolucion")}
              className={`rounded-xl px-3 py-3 text-sm font-semibold transition md:px-4 ${
                modo === "devolucion"
                  ? "bg-white text-orange-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Devolución al vendedor
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Paso 1
            </p>

            <h2
              className={`mt-2 text-2xl font-bold md:text-3xl ${
                esDevolucion
                  ? "text-orange-700"
                  : "text-[#1e3a8a]"
              }`}
            >
              {esDevolucion
                ? "Validar devolución"
                : "Validar entrega"}
            </h2>

            <p className="mt-2 text-slate-500">
              {esDevolucion
                ? "Captura el folio y código de devolución presentado por el vendedor antes de entregar el paquete."
                : "Escanea el QR del cliente o captura el folio y código de entrega para revisar el resumen antes de entregar el paquete."}
            </p>
          </div>

          {!pedido && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={
                  scannerActivo
                    ? detenerScanner
                    : iniciarScanner
                }
                className={`h-12 w-full rounded-xl font-semibold transition-all ${
                  scannerActivo
                    ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                    : esDevolucion
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow hover:shadow-lg"
                    : "bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow hover:shadow-lg"
                }`}
              >
                {scannerActivo
                  ? "📡 Cámara activa"
                  : esDevolucion
                  ? "📷 Escanear QR de devolución"
                  : "📷 Escanear QR del cliente"}
              </button>

              <div
                id="qr-reader"
                className={`w-full overflow-hidden rounded-3xl border shadow-sm ring-1 ${
                  esDevolucion
                    ? "border-orange-100 ring-orange-50"
                    : "border-blue-100 ring-blue-50"
                }`}
              />

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  o ingreso manual
                </span>

                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid gap-5">
                <input
                  className={`h-12 w-full rounded-xl border bg-white px-4 uppercase focus:outline-none focus:ring-2 ${
                    esDevolucion
                      ? "border-orange-200 focus:ring-orange-100"
                      : "border-slate-300 focus:ring-blue-100"
                  }`}
                  placeholder="EW-XXXXXXX"
                  value={folio}
                  onChange={(event) =>
                    setFolio(
                      event.target.value.toUpperCase()
                    )
                  }
                />

                <input
                  className={`h-12 w-full rounded-xl border bg-white px-4 focus:outline-none focus:ring-2 ${
                    esDevolucion
                      ? "border-orange-200 focus:ring-orange-100"
                      : "border-slate-300 focus:ring-blue-100"
                  }`}
                  placeholder={
                    esDevolucion
                      ? "Código de devolución (6 dígitos)"
                      : "Código de entrega (6 dígitos)"
                  }
                  inputMode="numeric"
                  maxLength={6}
                  value={codigo}
                  onChange={(event) =>
                    setCodigo(
                      event.target.value.replace(/\D/g, "")
                    )
                  }
                />
              </div>

              <button
                type="button"
                onClick={consultarPedido}
                disabled={loading}
                className={`h-12 w-full rounded-xl font-semibold text-white shadow transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                  esDevolucion
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-gradient-to-r from-[#2563eb] to-[#1e40af]"
                }`}
              >
                {loading
                  ? "Validando..."
                  : esDevolucion
                  ? "Ver resumen de la devolución"
                  : "Ver resumen del pedido"}
              </button>
            </div>
          )}

          {pedido && (
            <div className="space-y-6">
              <div
                className={`rounded-3xl border p-5 shadow-sm ${
                  esDevolucion
                    ? "border-orange-100 bg-orange-50"
                    : "border-blue-100 bg-blue-50"
                }`}
              >
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                    esDevolucion
                      ? "text-orange-500"
                      : "text-blue-500"
                  }`}
                >
                  {esDevolucion
                    ? "Devolución encontrada"
                    : "Pedido encontrado"}
                </p>

                <h3
                  className={`mt-2 text-xl font-bold ${
                    esDevolucion
                      ? "text-orange-700"
                      : "text-[#1e3a8a]"
                  }`}
                >
                  Resumen del paquete
                </h3>

                <div className="mt-4 grid gap-3 text-sm">
                  <InfoRow
                    label="Folio"
                    value={pedido.folio}
                    modo={modo}
                  />

                  <InfoRow
                    label="Producto"
                    value={pedido.producto}
                    modo={modo}
                  />

                  <InfoRow
                    label="Establecimiento"
                    value={pedido.establecimiento_nombre}
                    modo={modo}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {esDevolucion
                  ? "Antes de confirmar, verifica que el vendedor presente el código correcto y que el paquete físico coincida. Esta acción finalizará la devolución."
                  : "Antes de confirmar, verifica que el cliente presente el QR o código correcto y que el paquete físico coincida."}
              </div>

              <button
                type="button"
                onClick={confirmarEntrega}
                disabled={loading}
                className={`h-12 w-full rounded-xl font-semibold text-white shadow transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                  esDevolucion
                    ? "bg-gradient-to-r from-orange-500 to-orange-600"
                    : "bg-gradient-to-r from-[#2563eb] to-[#1e40af]"
                }`}
              >
                {loading
                  ? "Confirmando..."
                  : esDevolucion
                  ? "Confirmar devolución al vendedor"
                  : "Confirmar entrega al cliente"}
              </button>

              <button
                type="button"
                onClick={() => setPedido(null)}
                className="h-12 w-full rounded-xl bg-slate-200 font-semibold text-slate-700 transition hover:bg-slate-300"
              >
                Cancelar
              </button>
            </div>
          )}

          {mensaje && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                mensaje.startsWith("✅")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {mensaje}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl ${
                esDevolucion
                  ? "bg-orange-50"
                  : "bg-blue-50"
              }`}
            >
              🛡️
            </div>

            <div>
              <h3
                className={`font-bold ${
                  esDevolucion
                    ? "text-orange-700"
                    : "text-[#1e3a8a]"
                }`}
              >
                {esDevolucion
                  ? "Buenas prácticas de devolución"
                  : "Buenas prácticas de entrega"}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {esDevolucion
                  ? "Entrega la devolución únicamente cuando el vendedor presente un folio y código válidos. Si algo no coincide, no confirmes la entrega."
                  : "Entrega únicamente paquetes con folio y código válidos. Si algo no coincide, no confirmes la entrega y contacta al equipo Dropit."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  modo,
}: {
  label: string;
  value: string;
  modo: ModoEntrega;
}) {
  const esDevolucion = modo === "devolucion";

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border bg-white px-4 py-3 ${
        esDevolucion
          ? "border-orange-100"
          : "border-blue-100"
      }`}
    >
      <span className="text-slate-500">{label}</span>

      <span className="text-right font-semibold text-slate-900">
        {value || "—"}
      </span>
    </div>
  );
}