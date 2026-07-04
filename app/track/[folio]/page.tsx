"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  PackageCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Store,
  Truck,
} from "lucide-react";

const ESTADOS = [
  "creado",
  "pendiente_aprobacion_establecimiento",
  "en_transito",
  "pendiente_recoleccion",
  "entregado",
];

const ESTADOS_LABEL: Record<string, string> = {
  creado: "Creado",
  pendiente_aprobacion_establecimiento: "Validando establecimiento",
  en_transito: "En tránsito",
  pendiente_recoleccion: "Pendiente de recolección",
  entregado: "Entregado",
};

export default function TrackPedidoPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const folio = params?.folio as string;
  const confirmed = searchParams.get("confirmed");

  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!folio) return;

    const fetchPedido = async () => {
      const { data, error } = await supabase.rpc("get_pedido_tracking", {
        folio_param: folio,
      });

      if (error || !data || data.length === 0) {
        setError("Pedido no encontrado");
        setLoading(false);
        return;
      }

      setPedido(data[0]);
      setLoading(false);
    };

    fetchPedido();
  }, [folio]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-20 text-center font-medium text-red-600">
        {error}
      </div>
    );
  }

  if (!pedido) return null;

  const estadoIndex = ESTADOS.indexOf(pedido.estado);

  const fechaCreacion = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString()
    : "—";

  const eventos = Array.isArray(pedido.eventos) ? pedido.eventos : [];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 pb-36">
      <section className="mx-auto max-w-6xl space-y-6">
        {confirmed && (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 shadow-sm">
            <p className="font-semibold">✅ Punto de entrega confirmado</p>
            <p className="mt-1 text-sm">
              Ahora el establecimiento revisará tu pedido antes de que el
              vendedor reciba el código.
            </p>
          </div>
        )}

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 p-2">
                  <img
                    src="/brand/logo-dropit.png"
                    alt="Dropit"
                    className="h-full w-full object-contain"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Seguimiento de pedido
                  </p>
                  <p className="text-sm text-slate-500">
                    Estado actualizado en tiempo real
                  </p>
                </div>
              </div>

              <h1 className="text-3xl font-bold leading-tight text-[#1e3a8a] md:text-5xl">
                Pedido {pedido.folio}
              </h1>

              <p className="mt-3 max-w-2xl text-slate-600">
                Consulta el estado actual, punto de recolección e historial de
                movimientos.
              </p>
            </div>

            <div className="w-fit rounded-2xl bg-blue-50 px-5 py-4 text-[#1e3a8a]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Estado actual
              </p>
              <p className="mt-1 text-2xl font-bold">
                {ESTADOS_LABEL[pedido.estado] || pedido.estado}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<PackageCheck size={20} />}
            label="Producto"
            value={pedido.producto || "—"}
          />

          <SummaryCard
            icon={<Store size={20} />}
            label="Establecimiento"
            value={pedido.establecimiento_nombre || "Por definir"}
          />

          <SummaryCard
            icon={<Clock size={20} />}
            label="Fecha de creación"
            value={fechaCreacion}
          />
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Progreso
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#1e3a8a]">
                Ruta del pedido
              </h2>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-[#2563eb]">
              {ESTADOS_LABEL[pedido.estado] || pedido.estado}
            </span>
          </div>

          <div className="md:hidden space-y-5">
            {ESTADOS.map((estado, index) => {
              const completado = index < estadoIndex;
              const actual = index === estadoIndex;

              return (
                <StepMobile
                  key={estado}
                  index={index}
                  label={ESTADOS_LABEL[estado]}
                  completado={completado}
                  actual={actual}
                  isLast={index === ESTADOS.length - 1}
                />
              );
            })}
          </div>

          <div className="hidden md:block">
            <div className="relative">
              <div className="absolute left-8 right-8 top-5 h-1 rounded-full bg-slate-200" />

              <div className="relative grid grid-cols-5 gap-3">
                {ESTADOS.map((estado, index) => {
                  const completado = index < estadoIndex;
                  const actual = index === estadoIndex;

                  return (
                    <div
                      key={estado}
                      className="flex flex-col items-center text-center"
                    >
                      <div
                        className={`z-10 flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          completado
                            ? "bg-emerald-500 text-white"
                            : actual
                            ? "bg-[#2563eb] text-white ring-4 ring-blue-100"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <p
                        className={`mt-3 text-xs font-medium ${
                          actual ? "text-[#2563eb]" : "text-slate-600"
                        }`}
                      >
                        {ESTADOS_LABEL[estado]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {pedido.estado === "pendiente_aprobacion_establecimiento" && (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            ⏳ El establecimiento está revisando tu pedido. Te avisaremos en
            cuanto sea aceptado.
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-blue-50 p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2563eb]">
              <Truck size={22} />
            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Estado actual
            </p>

            <h3 className="mt-2 text-2xl font-bold text-[#1e3a8a]">
              {ESTADOS_LABEL[pedido.estado] || pedido.estado}
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              Tu pedido se actualizará conforme avance en el flujo Dropit.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} />
              Seguimiento seguro y protegido por Dropit
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-[#1e3a8a]">
              Historial del pedido
            </h3>

            {eventos.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                Aún no hay eventos registrados.
              </p>
            ) : (
              <div className="relative mt-6 space-y-6 pl-8">
                <div className="absolute bottom-0 left-3 top-0 w-[2px] rounded-full bg-slate-200" />

                {eventos.map((e: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[26px] top-1 h-4 w-4 rounded-full bg-[#2563eb] ring-4 ring-blue-50" />

                    <p className="font-semibold text-slate-900">
                      {ESTADOS_LABEL[e.estado] ?? e.estado}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {e.fecha ? new Date(e.fecha).toLocaleString() : "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ icon, label, value }: any) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
        {icon}
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-bold text-[#1e3a8a]">{value}</p>
    </div>
  );
}

function StepMobile({ index, label, completado, actual, isLast }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`z-10 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
            completado
              ? "bg-emerald-500 text-white"
              : actual
              ? "bg-[#2563eb] text-white ring-4 ring-blue-100"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {index + 1}
        </div>

        {!isLast && <div className="mt-1 h-10 w-[2px] bg-slate-200" />}
      </div>

      <div className="pt-1">
        <p
          className={`font-medium ${
            actual ? "text-[#2563eb]" : "text-slate-700"
          }`}
        >
          {label}
        </p>

        {actual && <p className="mt-1 text-xs text-slate-400">Estado actual</p>}
      </div>
    </div>
  );
}