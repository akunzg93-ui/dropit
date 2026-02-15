"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function ValidarPedidoPage() {
  const [folio, setFolio] = useState("");
  const [validando, setValidando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  // 🔒 candado real (no depende de render)
  const validandoRef = useRef(false);

  // -----------------------------------------------------
  // 🔹 Si ya hay pedido validado → salir de aquí
  // -----------------------------------------------------
  useEffect(() => {
    const pid = sessionStorage.getItem("pedido_id");
    if (pid) {
      window.location.replace("/comprador");
    }
  }, []);

  // -----------------------------------------------------
  // 🔹 Validar pedido
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
      const { data, error } = await supabase
        .from("pedidos")
        .select("id, estado")
        .eq("folio", folio.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setMensaje("Pedido no encontrado");
        return;
      }

      if (data.estado !== "creado") {
        setMensaje("Este pedido ya fue procesado");
        return;
      }

      // ✅ guardar pedido
      sessionStorage.setItem("pedido_id", data.id);

      // 🔥 FORZAR navegación (no interceptable por Next)
      window.location.replace("/comprador");

      // 🧯 Fallback absoluto (por si el browser se pone raro)
      setTimeout(() => {
        window.location.replace("/comprador");
      }, 300);
    } catch (e) {
      console.error(e);
      setMensaje("Error validando pedido");
    } finally {
      // esto solo corre si NO navegó
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
