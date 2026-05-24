"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";

type PedidoPreview = {
  id: string;
  folio: string;
  producto: string;
  establecimiento_nombre: string;
};

export default function RecibirPedidoPage() {
  const router = useRouter();
  const [folio, setFolio] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const [scannerActivo, setScannerActivo] = useState(false);
  const [pedido, setPedido] = useState<PedidoPreview | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const qrInstance = useRef<Html5Qrcode | null>(null);

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
        cameras.find((c) =>
          c.label.toLowerCase().includes("back")
        )?.id || cameras[0].id;

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
      const res = await fetch("/api/orders/preview-vendedor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folio: folio.trim(),
          codigo_vendedor: codigo.trim(),
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
  // 📦 CONFIRMAR RECEPCIÓN
  // --------------------------------------------------
  const confirmarRecepcion = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const res = await fetch("/api/orders/recibido", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folio,
          codigo_vendedor: codigo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.error || "Error al registrar recepción");
        return;
      }

      setShowSuccess(true);

      setPedido(null);
      setFolio("");
      setCodigo("");
    } catch (err) {
      setMensaje("Error de red");
    } finally {
      setLoading(false);
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
const cerrarPopup = () => {
  setShowSuccess(false);
};

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-12 pb-36">

      <div className="max-w-3xl mx-auto space-y-5 md:space-y-10">

        {showSuccess && (
  <div className="
    fixed
    inset-0
    z-50
    bg-black/40
    backdrop-blur-sm
    flex
    items-center
    justify-center
    px-4
  ">

    <div className="
      relative
      max-w-md
      w-full
      bg-white
      rounded-[32px]
      shadow-2xl
      border
      border-slate-200
      p-8
      text-center
      space-y-6
      animate-in
      fade-in
      zoom-in-95
      duration-300
    ">

      {/* CERRAR */}
      <button
        onClick={cerrarPopup}
        className="
          absolute
          top-4
          right-4
          h-10
          w-10
          rounded-full
          bg-slate-100
          hover:bg-slate-200
          transition
          text-slate-500
          font-bold
        "
      >
        ✕
      </button>

      {/* ICONO */}
      <div className="
        h-20
        w-20
        rounded-full
        bg-green-100
        flex
        items-center
        justify-center
        mx-auto
        text-4xl
      ">
        📦
      </div>

      {/* TEXO */}
      <div>
        <h1 className="
          text-2xl
          font-bold
          text-slate-800
        ">
          Felicidades! recibiste un paquete!
        </h1>

        <p className="
          text-slate-500
          mt-2
          text-sm
        ">
          El comprador fue notificado correctamente.
        </p>
      </div>

      {/* RECOMENDACIONES */}
      <div className="
        bg-slate-50
        border
        border-slate-200
        rounded-2xl
        p-4
        text-left
        text-sm
        text-slate-600
        space-y-2
      ">

        <p>
          • Resguarda el paquete en un lugar seguro
        </p>

        <p>
          • Verifica el folio antes de entregar
        </p>

        <p>
          • Utiliza una eitiqueta para identificar el paquete
        </p>

        <p>
          • Mantén el paquete protegido y seco
        </p>

      </div>

    </div>
  </div>
)}

        {/* HEADER PREMIUM */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-[28px] p-5 md:p-8 shadow-lg space-y-3">

          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Proceso operativo</span>
            <span>Recepción en establecimiento</span>
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-white rounded-full"></div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold leading-tight">
            Recepción de pedido
          </h1>

          <p className="text-white/90 text-sm">
            Valida el paquete escaneando el QR del vendedor o ingresando los datos manualmente.
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-5 md:p-8 space-y-5 transition-all duration-300">

          {!pedido && (
            <>
              {/* BOTÓN QR */}
              <button
                onClick={scannerActivo ? detenerScanner : iniciarScanner}
                className={`w-full py-3.5 md:py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                  scannerActivo
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-300 animate-pulse"
                    : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] text-white shadow-lg"
                }`}
              >
                {scannerActivo
                  ? "📡 Cámara activa"
                  : "📷 Escanear QR del vendedor"}
              </button>

              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden border border-slate-200"
              />

              {/* DIVISOR */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200" />

                <span className="text-xs text-slate-400 font-medium">
                  o ingreso manual
                </span>

                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* INPUTS */}
              <div className="space-y-4">

                <input
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="EW-XXXXXXX"
                  value={folio}
                  onChange={(e) =>
                    setFolio(e.target.value.toUpperCase())
                  }
                />

                <input
                  className="w-full border border-slate-300 rounded-2xl px-4 py-3.5 text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="Código de 6 dígitos"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
              </div>

              <button
                onClick={consultarPedido}
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium disabled:opacity-50 transition"
              >
                {loading
                  ? "Validando..."
                  : "Ver resumen del pedido"}
              </button>
            </>
          )}

          {pedido && (
            <div className="space-y-6 animate-fade-in transition-all duration-300">

              {/* RESUMEN */}
              <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50 transition-all duration-300 shadow-sm">

                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Resumen del pedido
                </h3>

                <div className="space-y-2 text-sm">

                  <div>
                    <span className="text-slate-500">
                      Folio:
                    </span>{" "}
                    <span className="font-medium">
                      {pedido.folio}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Producto:
                    </span>{" "}
                    <span className="font-medium">
                      {pedido.producto}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500">
                      Establecimiento:
                    </span>{" "}
                    <span className="font-medium">
                      {pedido.establecimiento_nombre}
                    </span>
                  </div>
                </div>
              </div>

              {/* CONFIRMAR */}
              <button
                onClick={confirmarRecepcion}
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading
                  ? "Confirmando..."
                  : "Confirmar recepción del paquete"}
              </button>

              <button
                onClick={() => setPedido(null)}
                className="w-full py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* MENSAJE */}
          {mensaje && (
            <div
              className={`mt-4 text-center font-medium transition-all duration-300 ${
                mensaje.startsWith("✅")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {mensaje.startsWith("✅") && (
                <div className="text-4xl mb-2 animate-bounce">
                  ✔
                </div>
              )}

              {mensaje}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}