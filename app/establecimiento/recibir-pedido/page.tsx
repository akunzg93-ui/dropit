"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type PedidoPreview = {
  id: string;
  folio: string;
  producto: string;
  establecimiento_nombre: string;
};

export default function RecibirPedidoPage() {
  const [folio, setFolio] = useState("");
  const [codigo, setCodigo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const [scannerActivo, setScannerActivo] = useState(false);
  const [pedido, setPedido] = useState<PedidoPreview | null>(null);

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
  // 🔍 PREVIEW DEL PEDIDO (VIA VENDEDOR)
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
        headers: { "Content-Type": "application/json" },
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
  // 📦 CONFIRMAR RECEPCIÓN DEL PAQUETE
  // --------------------------------------------------
  const confirmarRecepcion = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const res = await fetch("/api/orders/recibido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

      setMensaje("✅ Pedido recibido correctamente. El comprador fue notificado.");
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
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 space-y-5">

        <h1 className="text-2xl font-bold text-center text-blue-700">
          Recepción de pedido
        </h1>

        <p className="text-center text-sm text-gray-500">
          Esta pantalla se utiliza cuando un vendedor entrega un paquete
          en el establecimiento.
        </p>

        {!pedido && (
          <>
            <button
              onClick={scannerActivo ? detenerScanner : iniciarScanner}
              className={`w-full py-2 rounded font-semibold ${
                scannerActivo
                  ? "bg-gray-300 text-black"
                  : "bg-gray-900 text-white"
              }`}
            >
              {scannerActivo ? "Detener cámara" : "📷 Escanear QR del vendedor"}
            </button>

            <div id="qr-reader" className="w-full" />

            <div className="space-y-2">
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Folio"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
              />

              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Código de entrega del vendedor"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <button
              onClick={consultarPedido}
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Validando..." : "Ver resumen del pedido"}
            </button>
          </>
        )}

        {pedido && (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500">Pedido</p>
              <p className="font-semibold">{pedido.folio}</p>

              <p className="text-sm text-gray-500 mt-2">Producto</p>
              <p className="font-medium">{pedido.producto}</p>

              <p className="text-sm text-gray-500 mt-2">Establecimiento</p>
              <p className="font-medium">
                {pedido.establecimiento_nombre}
              </p>
            </div>

            <button
              onClick={confirmarRecepcion}
              disabled={loading}
              className="w-full py-2 bg-green-600 text-white rounded font-semibold"
            >
              {loading ? "Confirmando..." : "✅ Confirmar recepción del paquete"}
            </button>

            <button
              onClick={() => setPedido(null)}
              className="w-full py-2 bg-gray-200 text-black rounded"
            >
              Cancelar
            </button>
          </div>
        )}

        {mensaje && (
          <p className="text-center text-sm text-red-600">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
}
