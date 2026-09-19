"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  ReceiptText,
  Search,
  Wallet,
  X,
  XCircle,
} from "lucide-react";

type RetiroStatus = "pending" | "approved" | "paid" | "reversed";

type Aplicacion = {
  id: number;
  monto_aplicado: number;
  balance_movimientos: {
    id: number;
    establecimiento_id: string;
    created_at: string;
    pedidos: {
      folio: string;
    } | null;
    establecimientos: {
      nombre: string;
    } | null;
  } | null;
};

type Retiro = {
  id: string;
  monto: number;
  status: RetiroStatus;
  created_at: string;
  referencia_pago?: string | null;
  establecimiento_id?: string | null;

  titular_cuenta_destino?: string | null;
  banco_destino?: string | null;
  clabe_destino?: string | null;

  establecimientos?: {
    nombre: string;
  } | null;
  retiro_aplicaciones: Aplicacion[];
};

const filtros = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "paid", label: "Pagados" },
  { value: "reversed", label: "Rechazados" },
  { value: "all", label: "Todos" },
];

export default function AdminRetiros() {
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pending");
  const [busqueda, setBusqueda] = useState("");

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [retiroSeleccionado, setRetiroSeleccionado] =
    useState<Retiro | null>(null);

  const [referencia, setReferencia] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function fetchRetiros() {
  setLoading(true);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      console.error("Sesión inválida");
      setRetiros([]);
      return;
    }

    const params = new URLSearchParams();

    if (filtro !== "all") {
      params.set("status", filtro);
    }

    const res = await fetch(
      `/api/orders/retiros/admin?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const json = await res.json();

    if (!res.ok) {
      console.error(
        "Error cargando retiros:",
        json.error || "Error desconocido"
      );
      setRetiros([]);
      return;
    }

    console.log(
      "RETIROS ADMIN:",
      JSON.stringify(json.retiros, null, 2)
    );

    setRetiros((json.retiros || []) as Retiro[]);
  } catch (error) {
    console.error("Error cargando retiros:", error);
    setRetiros([]);
  } finally {
    setLoading(false);
  }
}
  useEffect(() => {
    fetchRetiros();
  }, [filtro]);

  const retirosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) return retiros;

    return retiros.filter((retiro) => {
      if (retiro.id.toLowerCase().includes(termino)) return true;

      if (
        retiro.establecimientos?.nombre
          ?.toLowerCase()
          .includes(termino)
      ) {
        return true;
      }

      return retiro.retiro_aplicaciones?.some((aplicacion) => {
        const movimiento = aplicacion.balance_movimientos;

        const folio =
          movimiento?.pedidos?.folio?.toLowerCase() || "";

        const establecimiento =
          movimiento?.establecimientos?.nombre?.toLowerCase() || "";

        return (
          folio.includes(termino) ||
          establecimiento.includes(termino)
        );
      });
    });
  }, [retiros, busqueda]);

  function abrirDetalle(retiro: Retiro) {
    setRetiroSeleccionado(retiro);
    setReferencia(retiro.referencia_pago || "");
    setDetalleOpen(true);
  }

  function cerrarDetalle() {
    if (procesando) return;

    setDetalleOpen(false);
    setRetiroSeleccionado(null);
    setReferencia("");
  }

  async function updateStatus(
    id: string,
    status: "approved" | "reversed"
  ) {
    setProcesando(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Sesión inválida");
        return;
      }

      const res = await fetch("/api/orders/retiros/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          retiro_id: id,
          status,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Error al actualizar retiro");
        return;
      }

      setDetalleOpen(false);
      setRetiroSeleccionado(null);
      setReferencia("");

      await fetchRetiros();
    } finally {
      setProcesando(false);
    }
  }

  async function marcarPagado() {
    if (!retiroSeleccionado) return;

    setProcesando(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Sesión inválida");
        return;
      }

      const res = await fetch("/api/orders/retiros/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          retiro_id: retiroSeleccionado.id,
          status: "paid",
          referencia_pago: referencia.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Error al registrar pago");
        return;
      }

      setDetalleOpen(false);
      setRetiroSeleccionado(null);
      setReferencia("");

      await fetchRetiros();
    } finally {
      setProcesando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
      {/* HEADER */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-sm font-medium text-blue-600">
            Finanzas
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Solicitudes de retiro
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Revisa los servicios incluidos antes de autorizar pagos a los
            establecimientos.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:self-start lg:self-auto">
          <Wallet className="h-5 w-5 text-blue-600" />

          <div>
            <p className="text-xs text-slate-400">
              Solicitudes visibles
            </p>

            <p className="font-semibold text-slate-900">
              {retirosFiltrados.length}
            </p>
          </div>
        </div>
      </section>

      {/* FILTROS */}
      <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
            {filtros.map((item) => (
              <button
                key={item.value}
                onClick={() => setFiltro(item.value)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                  filtro === item.value
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar folio o establecimiento"
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>
      </section>

      {/* DESKTOP */}
      <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr_0.8fr_0.8fr_0.5fr] gap-4 border-b border-slate-200 bg-slate-50/70 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Solicitud</span>
          <span>Servicios</span>
          <span>Establecimientos</span>
          <span>Total</span>
          <span>Estado</span>
          <span />
        </div>

        {retirosFiltrados.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-slate-100">
            {retirosFiltrados.map((retiro) => {
              const resumen = obtenerResumen(retiro);

              return (
                <button
                  key={retiro.id}
                  onClick={() => abrirDetalle(retiro)}
                  className="grid w-full grid-cols-[1.2fr_0.7fr_0.9fr_0.8fr_0.8fr_0.5fr] items-center gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatearSolicitud(retiro.id)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatearFecha(retiro.created_at)}
                    </p>
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {resumen.servicios}
                  </p>

                  <p className="text-sm font-medium text-slate-700">
                    {resumen.establecimientos}
                  </p>

                  <p className="font-semibold text-slate-950">
                    {formatearDinero(retiro.monto)}
                  </p>

                  <StatusBadge status={retiro.status} />

                  <div className="flex justify-end">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* MOBILE / TABLET */}
      <section className="space-y-3 lg:hidden">
        {retirosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <EmptyState />
          </div>
        ) : (
          retirosFiltrados.map((retiro) => {
            const resumen = obtenerResumen(retiro);

            return (
              <button
                key={retiro.id}
                onClick={() => abrirDetalle(retiro)}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {formatearSolicitud(retiro.id)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatearFecha(retiro.created_at)}
                    </p>
                  </div>

                  <StatusBadge status={retiro.status} />
                </div>

                <div className="my-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                  <div>
                    <p className="text-[11px] text-slate-400">
                      Servicios
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {resumen.servicios}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Establecimientos
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {resumen.establecimientos}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-400">
                      Total
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {formatearDinero(retiro.monto)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Revisar solicitud
                  </span>

                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            );
          })
        )}
      </section>

      {detalleOpen && retiroSeleccionado && (
        <DetalleRetiro
          retiro={retiroSeleccionado}
          referencia={referencia}
          setReferencia={setReferencia}
          procesando={procesando}
          cerrar={cerrarDetalle}
          aprobar={() =>
            updateStatus(retiroSeleccionado.id, "approved")
          }
          rechazar={() =>
            updateStatus(retiroSeleccionado.id, "reversed")
          }
          pagar={marcarPagado}
        />
      )}
    </div>
  );
}

function DetalleRetiro({
  retiro,
  referencia,
  setReferencia,
  procesando,
  cerrar,
  aprobar,
  rechazar,
  pagar,
}: {
  retiro: Retiro;
  referencia: string;
  setReferencia: (value: string) => void;
  procesando: boolean;
  cerrar: () => void;
  aprobar: () => void;
  rechazar: () => void;
  pagar: () => void;
}) {
  const grupos = agruparPorEstablecimiento(retiro);
  const resumen = obtenerResumen(retiro);
  const legacy = retiro.retiro_aplicaciones.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30 backdrop-blur-[2px]">
      <button
        aria-label="Cerrar detalle"
        onClick={cerrar}
        className="absolute inset-0 cursor-default"
      />

      <aside className="relative flex h-full w-full flex-col bg-slate-50 shadow-2xl sm:max-w-2xl">
        {/* HEADER */}
        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={retiro.status} />

                <span className="text-xs text-slate-400">
                  {formatearFecha(retiro.created_at)}
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                {formatearSolicitud(retiro.id)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Detalle de la solicitud de retiro
              </p>
            </div>

            <button
              onClick={cerrar}
              disabled={procesando}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResumenCard
              label="Servicios"
              value={resumen.servicios}
              icon={<ReceiptText className="h-4 w-4" />}
            />

            <ResumenCard
              label="Establecimientos"
              value={resumen.establecimientos}
              icon={<Building2 className="h-4 w-4" />}
            />

            <ResumenCard
              label="Total"
              value={formatearDinero(retiro.monto)}
              icon={<Wallet className="h-4 w-4" />}
            />
          </div>

          {retiro.clabe_destino && (
  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <Wallet className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          Datos para transferencia
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Cuenta registrada al momento de solicitar el retiro.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DatoTransferencia
            label="Titular"
            value={
              retiro.titular_cuenta_destino || "No disponible"
            }
          />

          <DatoTransferencia
            label="Banco"
            value={retiro.banco_destino || "No especificado"}
          />

          <div className="sm:col-span-2">
            <DatoTransferencia
              label="CLABE"
              value={retiro.clabe_destino}
              mono
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)}

          {legacy && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                Solicitud histórica
              </p>

              <p className="mt-1 text-sm text-amber-700">
                Este retiro fue creado antes del nuevo desglose por
                servicios. El detalle individual de pedidos no está
                disponible.
              </p>

              {retiro.establecimientos?.nombre && (
                <p className="mt-3 text-sm font-medium text-slate-800">
                  {retiro.establecimientos.nombre}
                </p>
              )}
            </div>
          )}

          {!legacy &&
            grupos.map((grupo) => (
              <div
                key={grupo.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-5">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {grupo.nombre}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {grupo.aplicaciones.length}{" "}
                      {grupo.aplicaciones.length === 1
                        ? "servicio"
                        : "servicios"}
                    </p>
                  </div>

                  <p className="shrink-0 font-semibold text-slate-900">
                    {formatearDinero(grupo.subtotal)}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {grupo.aplicaciones.map((aplicacion) => (
                    <div
                      key={aplicacion.id}
                      className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {aplicacion.balance_movimientos?.pedidos?.folio ||
                            "Pedido sin folio"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Servicio{" "}
                          {formatearFechaCorta(
                            aplicacion.balance_movimientos?.created_at
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold text-slate-900">
                        {formatearDinero(aplicacion.monto_aplicado)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

          {retiro.status === "approved" && !legacy && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    Solicitud aprobada
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Registra la transferencia una vez realizado el pago.
                  </p>

                  <input
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    placeholder="Referencia de pago (opcional)"
                    className="mt-4 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50"
                  />
                </div>
              </div>
            </div>
          )}

          {retiro.status === "paid" && retiro.referencia_pago && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                Referencia de pago
              </p>

              <p className="mt-1 break-all font-semibold text-slate-900">
                {retiro.referencia_pago}
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-200 bg-white p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
              Total del retiro
            </span>

            <span className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
              {formatearDinero(retiro.monto)}
            </span>
          </div>

          {retiro.status === "pending" && !legacy && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={rechazar}
                disabled={procesando}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Rechazar
              </button>

              <button
                onClick={aprobar}
                disabled={procesando}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {procesando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Aprobar retiro
              </button>
            </div>
          )}

          {retiro.status === "approved" && !legacy && (
            <button
              onClick={pagar}
              disabled={procesando}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {procesando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Registrar pago
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}

          {(retiro.status === "paid" ||
            retiro.status === "reversed" ||
            legacy) && (
            <button
              onClick={cerrar}
              className="min-h-12 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cerrar
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center sm:py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Wallet className="h-6 w-6 text-slate-400" />
      </div>

      <p className="font-semibold text-slate-900">
        No hay solicitudes
      </p>

      <p className="mt-1 text-sm text-slate-500">
        No encontramos retiros con los filtros seleccionados.
      </p>
    </div>
  );
}

function ResumenCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {icon}
      </div>

      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function DatoTransferencia({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p
        className={`mt-1 break-all font-semibold text-slate-900 ${
          mono ? "font-mono tracking-wide" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: RetiroStatus }) {
  const config = {
    pending: {
      label: "Pendiente",
      style: "bg-amber-50 text-amber-700 ring-amber-600/10",
      icon: <Clock3 className="h-3.5 w-3.5" />,
    },
    approved: {
      label: "Aprobado",
      style: "bg-blue-50 text-blue-700 ring-blue-600/10",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    paid: {
      label: "Pagado",
      style:
        "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    reversed: {
      label: "Rechazado",
      style: "bg-red-50 text-red-700 ring-red-600/10",
      icon: <XCircle className="h-3.5 w-3.5" />,
    },
  };

  const item = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${item.style}`}
    >
      {item.icon}
      {item.label}
    </span>
  );
}

function obtenerResumen(retiro: Retiro) {
  const aplicaciones = retiro.retiro_aplicaciones || [];

  if (aplicaciones.length === 0) {
    return {
      servicios: "—",
      establecimientos: retiro.establecimiento_id ? "1" : "—",
    };
  }

  const establecimientos = new Set(
    aplicaciones
      .map(
        (aplicacion) =>
          aplicacion.balance_movimientos?.establecimiento_id
      )
      .filter(Boolean)
  );

  return {
    servicios: String(aplicaciones.length),
    establecimientos: String(establecimientos.size),
  };
}

function agruparPorEstablecimiento(retiro: Retiro) {
  const mapa = new Map<
    string,
    {
      id: string;
      nombre: string;
      aplicaciones: Aplicacion[];
      subtotal: number;
    }
  >();

  for (const aplicacion of retiro.retiro_aplicaciones || []) {
    const movimiento = aplicacion.balance_movimientos;

    if (!movimiento) continue;

    const id = movimiento.establecimiento_id;
    const nombre =
      movimiento.establecimientos?.nombre || "Establecimiento";

    if (!mapa.has(id)) {
      mapa.set(id, {
        id,
        nombre,
        aplicaciones: [],
        subtotal: 0,
      });
    }

    const grupo = mapa.get(id)!;

    grupo.aplicaciones.push(aplicacion);
    grupo.subtotal += Number(aplicacion.monto_aplicado || 0);
  }

  return Array.from(mapa.values()).map((grupo) => ({
    ...grupo,
    subtotal: Math.round(grupo.subtotal * 100) / 100,
  }));
}

function formatearDinero(value: number | string) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value || 0));
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatearFechaCorta(value?: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatearSolicitud(id: string) {
  return `#${id.slice(0, 8).toUpperCase()}`;
}