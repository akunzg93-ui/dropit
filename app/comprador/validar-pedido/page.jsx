"use client";

import { useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  PackageCheck,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Search,
  MapPin,
  Clock,
} from "lucide-react";

export default function ValidarPedidoPage() {
  const [folio, setFolio] = useState("");
  const [validando, setValidando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estadoVisual, setEstadoVisual] = useState("idle");

  const validandoRef = useRef(false);

  useEffect(() => {
    const limpio = folio.trim().toUpperCase();

    if (limpio.length >= 10 && limpio.startsWith("EW-")) {
      validarPedido();
    }
    // eslint-disable-next-line
  }, [folio]);

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
    <main className="min-h-screen bg-slate-50 px-5 py-12 pb-36">
      <section className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50 p-4 shadow-sm">
  <img
    src="/brand/logo-dropit.png"
    alt="Dropit"
    className="h-full w-full object-contain"
  />
</div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Seguimiento Dropit
          </p>

          <h1 className="mt-3 text-4xl font-bold text-[#1e3a8a] md:text-5xl">
            Rastrear pedido
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Consulta el estatus de tu envío o elige un establecimiento usando el folio que te compartió el
            vendedor.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                {estadoVisual === "buscando" && (
                  <Loader2 className="animate-spin text-[#2563eb]" size={22} />
                )}

                {estadoVisual === "encontrado" && (
                  <CheckCircle2 className="text-emerald-500" size={22} />
                )}

                {estadoVisual === "idle" && (
                  <Search className="text-slate-400" size={22} />
                )}
              </div>

              <input
                className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-5 text-xl font-bold uppercase tracking-wider text-[#1e3a8a] transition placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="EW-XXXXXXXX"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") validarPedido();
                }}
                disabled={validando}
              />
            </div>

            <button
              type="button"
              onClick={validarPedido}
              disabled={validando}
              className="h-16 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1e40af] px-8 font-semibold text-white shadow transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
            >
              {validando ? "Validando..." : "Rastrear pedido"}
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              Ejemplo: <span className="font-semibold">EW-AB12CD34</span>
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} />
              Conexión segura y protegida por Dropit
            </div>
          </div>

          {mensaje && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600 animate-pulse">
              {mensaje}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Con tu folio podrás
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MiniFeature icon={<MapPin size={18} />} text="Elegir punto de entrega" />
            <MiniFeature icon={<Clock size={18} />} text="Consultar el estado" />
            <MiniFeature icon={<PackageCheck size={18} />} text="Ver historial" />
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniFeature({ icon, text }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-[#1e3a8a]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2563eb]">
        {icon}
      </span>
      {text}
    </div>
  );
}