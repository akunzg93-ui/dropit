"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type PedidoPreview = {
  id: string;
  folio: string;
  producto: string;
  establecimiento_nombre: string;
};

export default function EntregarPedidoPage() {
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
        cameras.find((c) => c.label.toLowerCase().includes("back"))?.id ||
        cameras[0].id;

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: 260 },
        (decodedText: string) => {
          if (!decodedText.includes("|")) {
            setMensaje("QR inválido");
            return;
          }

          const [f, c] = decodedText.split("|");

          setFolio(f);
          setCodigo(c);

          detenerScanner();
        },
        () => {}
      );

      setScannerActivo(true);
    } catch (err) {
      console.error("❌ Error cámara:", err);
      setMensaje("No se pudo acceder a la cámara");
    }
  };

  const detenerScanner = async () => {
    try {
      if (qrInstance.current) {
        await qrInstance.current.stop();
        await qrInstance.current.clear();
      }
    } catch (_) {}

    setScannerActivo(false);
  };

  const consultarPedido = async () => {
    if (!folio || !codigo) {
      setMensaje("Ingresa folio y código");
      return;
    }

    setLoading(true);
    setMensaje("");

    try {
      const res = await fetch("/api/orders/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folio: folio.trim(),
          codigo_entrega: codigo.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "No se pudo validar el pedido");
        return;
      }

      setPedido(data.pedido);
    } catch (err) {
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
      const res = await fetch("/api/orders/entregado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folio,
          codigo_entrega: codigo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "Error al entregar pedido");
        return;
      }

      pedidoEntregadoRef.current = pedido;

      setShowDelivered(true);
      setPedido(null);
      setFolio("");
      setCodigo("");

      setTimeout(() => {
        setShowDelivered(false);
        setShowEvaluation(true);
      }, 1800);
    } catch (err) {
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

      await fetch("/api/orders/evaluaciones/create", {
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
      });

      setSuccessEval(true);

      setTimeout(() => {
        setShowEvaluation(false);
        setSuccessEval(false);
        pedidoEntregadoRef.current = null;
        setComentario("");
        setQuickTags([]);
        setRating(5);
      }, 1800);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingEval(false);
    }
  };

  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      {showDelivered && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 text-center space-y-5">
            <div className="h-20 w-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-4xl">
              ✅
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#1e3a8a]">
                Pedido entregado
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                La entrega final del paquete fue registrada correctamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {showEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-7 space-y-6">
            <button
              onClick={() => setShowEvaluation(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-4xl">
                ⭐
              </div>

              <h2 className="text-2xl font-bold text-[#1e3a8a] mt-4">
                ¿Cómo fue tu experiencia?
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Tu evaluación ayuda a mejorar la calidad de Dropit.
              </p>
            </div>

            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`transition-all duration-200 hover:scale-110 ${
                    n <= rating ? "text-amber-400" : "text-slate-300"
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
                        setQuickTags(quickTags.filter((t) => t !== tag));
                      } else {
                        setQuickTags([...quickTags, tag]);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm transition border ${
                      active
                        ? "bg-[#2563eb] text-white border-[#2563eb]"
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            {successEval && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                <div className="text-4xl">✅</div>

                <p className="mt-2 text-emerald-700 font-semibold">
                  ¡Gracias por tu evaluación!
                </p>
              </div>
            )}

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Comentario opcional..."
              className="w-full border border-slate-200 rounded-2xl p-4 text-sm min-h-[110px] focus:ring-2 focus:ring-blue-100 focus:outline-none transition"
            />

            <button
              onClick={enviarEvaluacion}
              disabled={sendingEval}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg disabled:opacity-70 transition"
            >
              {sendingEval ? "Enviando..." : "Enviar evaluación"}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
              Logística fácil y sin dramas
            </p>

            <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mt-3 leading-tight">
              Entrega de pedido <span className="inline-block">📦</span>
            </h1>

            <p className="text-slate-600 mt-4 max-w-2xl text-lg">
              Escanea el QR del cliente o ingresa el código manual para
              confirmar la entrega final del paquete.
            </p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
              Paso 1
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
              Validar entrega
            </h2>

            <p className="text-slate-500 mt-2">
              Escanea el QR del cliente o captura el folio y código de entrega
              para revisar el resumen antes de entregar el paquete.
            </p>
          </div>

          {!pedido && (
            <div className="space-y-5">
              <button
                onClick={scannerActivo ? detenerScanner : iniciarScanner}
                className={`w-full h-12 rounded-xl font-semibold transition-all ${
                  scannerActivo
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow hover:shadow-lg"
                }`}
              >
                {scannerActivo ? "📡 Cámara activa" : "📷 Escanear QR del cliente"}
              </button>

              <div
                id="qr-reader"
                className="w-full rounded-3xl overflow-hidden border border-blue-100 shadow-sm ring-1 ring-blue-50"
              />

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  o ingreso manual
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid gap-5">
                <input
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 focus:ring-2 focus:ring-blue-100 focus:outline-none uppercase"
                  placeholder="EW-XXXXXXX"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value.toUpperCase())}
                />

                <input
                  className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  placeholder="Código de entrega (6 dígitos)"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <button
                onClick={consultarPedido}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Validando..." : "Ver resumen del pedido"}
              </button>
            </div>
          )}

          {pedido && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-semibold">
                  Pedido encontrado
                </p>

                <h3 className="text-xl font-bold text-[#1e3a8a] mt-2">
                  Resumen del pedido
                </h3>

                <div className="mt-4 grid gap-3 text-sm">
                  <InfoRow label="Folio" value={pedido.folio} />
                  <InfoRow label="Producto" value={pedido.producto} />
                  <InfoRow
                    label="Establecimiento"
                    value={pedido.establecimiento_nombre}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Antes de confirmar, verifica que el cliente presente el QR o
                código correcto y que el paquete físico coincida.
              </div>

              <button
                onClick={confirmarEntrega}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white font-semibold shadow hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Confirmando..." : "Confirmar entrega del paquete"}
              </button>

              <button
                onClick={() => setPedido(null)}
                className="w-full h-12 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition"
              >
                Cancelar
              </button>
            </div>
          )}

          {mensaje && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                mensaje.startsWith("✅")
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {mensaje}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-xl">
              🛡️
            </div>

            <div>
              <h3 className="font-bold text-[#1e3a8a]">
                Buenas prácticas de entrega
              </h3>

              <p className="text-sm text-slate-600 mt-1">
                Entrega únicamente paquetes con folio y código válidos. Si algo
                no coincide, no confirmes la entrega y contacta al equipo
                Dropit.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white border border-blue-100 px-4 py-3">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900 text-right">{value}</span>
    </div>
  );
}