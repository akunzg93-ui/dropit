"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ValidarPedidoPage() {
  const [folio, setFolio] = useState("");
  const [validando, setValidando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const validandoRef = useRef(false);

  // -----------------------------------------------------
  // 🔹 Validar pedido (VERSIÓN SEGURA CON RPC)
  // -----------------------------------------------------
  async function validarPedido() {
    if (validandoRef.current) return;

    if (!folio.trim()) {
      setMensaje("Ingresa el folio del pedido");
      return;
    }

    validandoRef.current = true;
    setValidando(true);
    setMensaje("");

    try {
      // 🔥 AHORA usamos RPC pública (ignora RLS)
      const { data, error } = await supabase.rpc(
        "get_pedido_by_folio_public",
        { folio_param: folio.trim().toUpperCase() }
      );

      const pedido = Array.isArray(data) ? data[0] : data;

      if (error || !pedido) {
        setMensaje("Pedido no encontrado");
        return;
      }

      // -------------------------------------------------
      // 🔥 LÓGICA PROFESIONAL
      // -------------------------------------------------

      // Si ya tiene establecimiento → ir a track
      if (pedido.establecimiento_uuid) {
        sessionStorage.removeItem("pedido_id");
        window.location.replace(`/track/${pedido.folio}`);
        return;
      }

      // Si ya no está en creado → también ir a track
      if (pedido.estado !== "creado") {
        sessionStorage.removeItem("pedido_id");
        window.location.replace(`/track/${pedido.folio}`);
        return;
      }

      // ✅ Pedido nuevo → flujo normal
      sessionStorage.setItem("pedido_id", pedido.id);
      window.location.replace("/comprador");

    } catch (e) {
      console.error(e);
      setMensaje("Error validando pedido");
    } finally {
      validandoRef.current = false;
      setValidando(false);
    }
  }

  // -----------------------------------------------------
  // 🔹 UI
  // -----------------------------------------------------
  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold text-center">
        Validar pedido
      </h1>

      <input
        className="border rounded px-3 py-2 w-full"
        placeholder="EW-XXXXXXX"
        value={folio}
        onChange={(e) => setFolio(e.target.value)}
        disabled={validando}
      />

      <button
        onClick={validarPedido}
        disabled={validando}
        className="w-full py-2 bg-blue-600 text-white rounded disabled:opacity-60"
      >
        {validando ? "Validando..." : "Validar pedido"}
      </button>

      {mensaje && (
        <p className="text-sm text-red-600 text-center">
          {mensaje}
        </p>
      )}
    </div>
  );
}
