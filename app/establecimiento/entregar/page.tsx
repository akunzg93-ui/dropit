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

  const qrInstance = useRef<Html5Qrcode | null>(null);

  // ⭐ EVALUACIÓN
const [showEvaluation, setShowEvaluation] =
  useState(false);
const [showDelivered, setShowDelivered] =
  useState(false);
const [rating, setRating] =
  useState(5);

const [comentario, setComentario] =
  useState("");

  const [successEval, setSuccessEval] =
  useState(false);

const [quickTags, setQuickTags] =
  useState<string[]>([]);

const [sendingEval, setSendingEval] =
  useState(false);

  // --------------------------------------------------
  // 📷 INICIAR ESCÁNER
  // --------------------------------------------------
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
          console.log("📸 QR leído:", decodedText);

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

  // --------------------------------------------------
  // 🛑 DETENER ESCÁNER
  // --------------------------------------------------
  const detenerScanner = async () => {
    try {
      if (qrInstance.current) {
        await qrInstance.current.stop();
        await qrInstance.current.clear();
      }
    } catch (_) {}
    setScannerActivo(false);
  };

  // --------------------------------------------------
  // 🔍 PREVIEW DEL PEDIDO
  // --------------------------------------------------
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

  // --------------------------------------------------
  // 📦 CONFIRMAR ENTREGA AL COMPRADOR
  // --------------------------------------------------
  const confirmarEntrega = async () => {
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

      setShowDelivered(true);

setMensaje("✅ Pedido entregado correctamente");
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

// --------------------------------------------------
// ⭐ ENVIAR EVALUACIÓN
// --------------------------------------------------

const enviarEvaluacion = async () => {

  try {

    setSendingEval(true);

    const comentarioFinal = [
      ...quickTags,
      comentario,
    ]
      .filter(Boolean)
      .join(" • ");

    await fetch(
      "/api/orders/evaluaciones/create",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          pedido_id: pedido?.id,
          rating,
          comentario:
            comentarioFinal,
          tipo_evaluador:
            "establecimiento",
          tipo_evaluado:
            "vendedor",
        }),
      }
    );

    setSuccessEval(true);

    setTimeout(() => {

      setShowEvaluation(false);

      setSuccessEval(false);

      setPedido(null);

      setFolio("");
      setCodigo("");

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

  // --------------------------------------------------
  // 🧹 CLEANUP
  // --------------------------------------------------
  useEffect(() => {
    return () => {
      detenerScanner();
    };
  }, []);

  // --------------------------------------------------
  // 🖥 UI
  // --------------------------------------------------
 return (
  <div className="min-h-screen bg-[#f6f9fc] px-4 py-8 md:py-10 pb-36">
    {/* ✅ MODAL ENTREGA EXITOSA */}
    {showDelivered && (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 p-8 text-center">
          <div className="h-24 w-24 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-5xl">
            ✅
          </div>

          <h2 className="mt-6 text-2xl font-extrabold text-slate-900">
            Pedido entregado
          </h2>

          <p className="mt-3 text-slate-500">
            El pedido se entregó correctamente.
          </p>
        </div>
      </div>
    )}

    {/* ⭐ MODAL EVALUACIÓN */}
    {showEvaluation && (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4">
        <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl border border-slate-200 p-7 space-y-6">
          <button
            onClick={() => setShowEvaluation(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            ✕
          </button>

          <div className="text-center">
            <div className="h-20 w-20 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto text-4xl">
              ⭐
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mt-4">
              ¿Cómo fue tu experiencia?
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              Tu evaluación ayuda a mejorar la calidad de Dropit.
            </p>
          </div>

          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={`transition-all duration-200 hover:scale-125 ${
                  n <= rating
                    ? "text-amber-400 scale-110 drop-shadow-lg"
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
                      setQuickTags(quickTags.filter((t) => t !== tag));
                    } else {
                      setQuickTags([...quickTags, tag]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm transition-all duration-200 border ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 scale-105"
                      : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {successEval && (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center animate-pulse">
              <div className="text-4xl">✅</div>

              <p className="mt-2 text-green-700 font-semibold">
                ¡Gracias por tu evaluación!
              </p>
            </div>
          )}

          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Comentario opcional..."
            className="w-full border border-slate-200 rounded-2xl p-4 text-sm min-h-[110px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />

          <button
            onClick={enviarEvaluacion}
            disabled={sendingEval}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold shadow-lg shadow-blue-200 disabled:opacity-70 transition"
          >
            {sendingEval ? "Enviando..." : "Enviar evaluación"}
          </button>
        </div>
      </div>
    )}

    <div className="max-w-5xl mx-auto space-y-7">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 p-8 md:p-10 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/90 mb-4">
            📦 Entrega al cliente
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
            Entrega de pedido
          </h1>

          <p className="mt-3 text-white/90 text-sm md:text-base">
            Escanea el QR del cliente o ingresa el código manual para confirmar
            la entrega final del paquete.
          </p>
        </div>

    
      </div>

      {/* CARD */}
      <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/70 border border-slate-200 p-6 md:p-8 space-y-7">
        {!pedido && (
          <>
            <button
              onClick={scannerActivo ? detenerScanner : iniciarScanner}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                scannerActivo
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                  : "bg-gradient-to-r from-blue-700 to-blue-600 hover:scale-[1.01] text-white shadow-blue-200"
              }`}
            >
              {scannerActivo ? "📡 Cámara activa" : "📷 Escanear QR del cliente"}
            </button>

            <div
              id="qr-reader"
              className="w-full rounded-3xl overflow-hidden border border-slate-200 bg-slate-50"
            />

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-semibold">
                o ingreso manual
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <input
                className="w-full border border-slate-300 rounded-2xl px-4 py-4 text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="EW-XXXXXXX"
                value={folio}
                onChange={(e) => setFolio(e.target.value.toUpperCase())}
              />

              <input
                className="w-full border border-slate-300 rounded-2xl px-4 py-4 text-base font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                placeholder="Código de entrega (6 dígitos)"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <button
              onClick={consultarPedido}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-700 to-blue-600 hover:scale-[1.01] text-white rounded-2xl font-bold disabled:opacity-60 disabled:hover:scale-100 transition shadow-lg shadow-blue-200"
            >
              {loading ? "Validando..." : "Ver resumen del pedido"}
            </button>
          </>
        )}

        {pedido && (
          <div className="space-y-6 animate-fade-in transition-all duration-300">
            <div className="rounded-3xl p-6 border border-blue-100 bg-blue-50/60">
              <h3 className="text-xl font-extrabold text-slate-900 mb-5">
                Resumen del pedido
              </h3>

              <div className="grid gap-4">
                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Folio</p>
                  <p className="font-bold text-slate-900">{pedido.folio}</p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Producto</p>
                  <p className="font-bold text-slate-900">{pedido.producto}</p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Establecimiento</p>
                  <p className="font-bold text-slate-900">
                    {pedido.establecimiento_nombre}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-slate-700 text-sm md:text-base">
              ✅ Verifica que el cliente sea quien presenta el QR o código de
              entrega antes de confirmar.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={confirmarEntrega}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold transition shadow-lg shadow-blue-200 hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
              >
                {loading ? "Confirmando..." : "Confirmar entrega del paquete"}
              </button>

              <button
                onClick={() => setPedido(null)}
                className="w-full py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold transition border border-slate-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {mensaje && (
          <div
            className={`rounded-2xl p-4 text-center font-semibold border ${
              mensaje.startsWith("✅")
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            {mensaje.startsWith("✅") && (
              <div className="text-4xl mb-2 animate-bounce">✔</div>
            )}

            {mensaje}
          </div>
        )}
      </div>
    </div>
  </div>
);
}