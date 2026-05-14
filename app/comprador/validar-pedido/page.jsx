"use client";

import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  PackageCheck,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function ValidarPedidoPage() {
  const [folio, setFolio] = useState("");
  const [validando, setValidando] = useState(false);
  const [mensaje, setMensaje] = useState("");
 const [estadoVisual, setEstadoVisual] = useState("idle");

  const validandoRef = useRef(false);

  // -----------------------------------------------------
  // 🔹 VALIDACIÓN AUTOMÁTICA CUANDO EL FOLIO PARECE VÁLIDO
  // -----------------------------------------------------
  useEffect(() => {
    const limpio = folio.trim().toUpperCase();

    if (limpio.length >= 10 && limpio.startsWith("EW-")) {
      validarPedido();
    }
    // eslint-disable-next-line
  }, [folio]);

  // -----------------------------------------------------
  // 🔹 VALIDAR PEDIDO
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
    setEstadoVisual("buscando");

    try {
      const { data, error } = await supabase.rpc(
        "get_pedido_by_folio_public",
        { folio_param: folio.trim().toUpperCase() }
      );

      const pedido = Array.isArray(data) ? data[0] : data;

      if (error || !pedido) {
        setMensaje("Pedido no encontrado");
        setEstadoVisual("idle");
        return;
      }

      // 🎉 Animación de éxito antes de redirigir
      setEstadoVisual("encontrado");

      await new Promise((resolve) => setTimeout(resolve, 900));

      if (pedido.establecimiento_uuid) {
        sessionStorage.removeItem("pedido_id");
        window.location.replace(`/track/${pedido.folio}`);
        return;
      }

      if (pedido.estado !== "creado") {
        sessionStorage.removeItem("pedido_id");
        window.location.replace(`/track/${pedido.folio}`);
        return;
      }

      sessionStorage.setItem("pedido_id", pedido.id);
      window.location.replace("/comprador");

    } catch (e) {
      console.error(e);
      setMensaje("Error validando pedido");
      setEstadoVisual("idle");
    } finally {
      validandoRef.current = false;
      setValidando(false);
    }
  }

  return (
  <div className="min-h-screen bg-slate-50 pb-36">

    {/* HEADER */}
    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white pt-5 pb-16 md:pt-8 md:pb-20 px-4 md:px-6">
      <div className="max-w-4xl mx-auto text-center space-y-2">

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
          <ShieldCheck size={14} />
          Seguimiento seguro
        </div>

        <h1 className="text-xl md:text-4xl font-bold leading-tight">
          Rastrea o confirma tu pedido Dropit
        </h1>

        <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto">
          Confirma o rastrea tu pedido de forma rápida y segura.
        </p>
      </div>
    </div>

    {/* CARD */}
    <div className="max-w-md mx-auto -mt-10 px-4 md:px-6">
      <div className="bg-white rounded-[28px] shadow-xl border border-slate-200 p-4 md:p-10 space-y-5 transition-all duration-300">

        {/* ICONO DINÁMICO */}
        <div className="flex justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-[28px] bg-indigo-100 flex items-center justify-center transition-all">

            {estadoVisual === "buscando" && (
              <Loader2
                className="animate-spin text-indigo-600"
                size={28}
              />
            )}

            {estadoVisual === "encontrado" && (
              <CheckCircle2
                className="text-emerald-500 scale-110 transition"
                size={28}
              />
            )}

            {estadoVisual === "idle" && (
              <PackageCheck
                className="text-indigo-600"
                size={28}
              />
            )}

          </div>
        </div>

        {/* INPUT */}
        <div className="space-y-3">

          <input
            className="
              w-full
              border
              border-slate-300
              rounded-2xl
              px-5
              py-4
              text-center
              text-2xl
              tracking-wider
              uppercase
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
              transition
            "
            placeholder="EW-XXXXXXX"
            value={folio}
            onChange={(e) => setFolio(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") validarPedido();
            }}
            disabled={validando}
          />

          <p className="text-xs text-slate-500 text-center">
            Ejemplo:{" "}
            <span className="font-semibold">
              EW-AB12CD34
            </span>
          </p>
        </div>

        {/* BOTÓN */}
        <button
          onClick={validarPedido}
          disabled={validando}
          className="
            w-full
            h-14
            rounded-2xl
            bg-gradient-to-r
            from-indigo-600
            to-blue-600
            text-white
            font-semibold
            shadow-lg
            hover:shadow-xl
            hover:scale-[1.02]
            active:scale-[0.98]
            transition-all
            disabled:opacity-60
          "
        >
          {validando
            ? "Validando..."
            : "Validar pedido"}
        </button>

        {/* ERROR */}
        {mensaje && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-3 px-4 rounded-2xl animate-pulse">
            {mensaje}
          </div>
        )}

        {/* SEGURIDAD */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
          <ShieldCheck size={14} />
          Conexión segura y protegida por Dropit
        </div>

      </div>
    </div>
  </div>
);
}