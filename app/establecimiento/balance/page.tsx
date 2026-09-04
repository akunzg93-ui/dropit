"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock3,
  Wallet,
  Building2,
  PackageCheck,
} from "lucide-react";

type Establecimiento = {
  uuid: string;
  nombre: string;
};

type Movimiento = {
  id: number;
  pedido_id: number;
  establecimiento_id: string;
  neto_establecimiento: number;
  monto_bruto: number;
  comision_monto: number;
  iva_monto: number;
  status: string;
  created_at: string;
  pedidos?: {
    folio?: string;
  } | null;
};

type Aplicacion = {
  balance_movimiento_id: number;
  monto_aplicado: number;
  retiro_id: string;
  retiros?: {
    id: string;
    status: string;
  } | null;
};

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getMexicoYearMonth(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(value));

  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  };
}

function esMesActualMexico(value: string) {
  const actual = getMexicoYearMonth(new Date());
  const movimiento = getMexicoYearMonth(value);

  return (
    actual.year === movimiento.year &&
    actual.month === movimiento.month
  );
}

export default function BalanceEstablecimiento() {
  const [establecimientos, setEstablecimientos] = useState<
    Establecimiento[]
  >([]);

  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);

  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [filtroEstablecimiento, setFiltroEstablecimiento] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [loadingRetiro, setLoadingRetiro] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarBalance();
  }, []);

  async function cargarBalance() {
    setLoading(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // ─────────────────────────────────────
    // ESTABLECIMIENTOS DEL USUARIO
    // ─────────────────────────────────────

    const { data: establecimientosData, error: establecimientosError } =
      await supabase
        .from("establecimientos")
        .select("uuid, nombre")
        .eq("usuario_id", user.id)
        .order("nombre");

    if (establecimientosError) {
      setMensaje("No fue posible cargar tus establecimientos");
      setLoading(false);
      return;
    }

    const misEstablecimientos = establecimientosData || [];

    setEstablecimientos(misEstablecimientos);

    if (misEstablecimientos.length === 0) {
      setMovimientos([]);
      setAplicaciones([]);
      setLoading(false);
      return;
    }

    const establecimientoIds = misEstablecimientos.map((e) => e.uuid);

    // ─────────────────────────────────────
    // LEDGER FINANCIERO
    // ─────────────────────────────────────

    const { data: movimientosData, error: movimientosError } =
      await supabase
        .from("balance_movimientos")
        .select(`
          id,
          pedido_id,
          establecimiento_id,
          neto_establecimiento,
          monto_bruto,
          comision_monto,
          iva_monto,
          status,
          created_at,
          pedidos (
            folio
          )
        `)
        .in("establecimiento_id", establecimientoIds)
        .order("created_at", { ascending: false });

    if (movimientosError) {
      console.error(movimientosError);
      setMensaje("No fue posible cargar los movimientos");
      setLoading(false);
      return;
    }

    const movs = (movimientosData || []) as unknown as Movimiento[];

    setMovimientos(movs);

    if (movs.length === 0) {
      setAplicaciones([]);
      setSeleccionados([]);
      setLoading(false);
      return;
    }

    // ─────────────────────────────────────
    // SOLICITUDES QUE UTILIZAN MOVIMIENTOS
    // ─────────────────────────────────────

    const movimientoIds = movs.map((m) => m.id);

    const { data: aplicacionesData, error: aplicacionesError } =
      await supabase
        .from("retiro_aplicaciones")
        .select(`
          balance_movimiento_id,
          monto_aplicado,
          retiro_id,
          retiros (
            id,
            status
          )
        `)
        .in("balance_movimiento_id", movimientoIds);

    if (aplicacionesError) {
      console.error(aplicacionesError);
      setMensaje("No fue posible cargar las solicitudes de retiro");
      setLoading(false);
      return;
    }

    setAplicaciones(
      (aplicacionesData || []) as unknown as Aplicacion[]
    );

    setSeleccionados([]);
    setLoading(false);
  }

  // ─────────────────────────────────────
  // CLASIFICACIÓN
  // ─────────────────────────────────────

  function tieneRetiroActivo(movimientoId: number) {
    return aplicaciones.some(
      (app) =>
        app.balance_movimiento_id === movimientoId &&
        (app.retiros?.status === "pending" ||
          app.retiros?.status === "approved")
    );
  }

  function tieneRetiroPagado(movimientoId: number) {
    return aplicaciones.some(
      (app) =>
        app.balance_movimiento_id === movimientoId &&
        app.retiros?.status === "paid"
    );
  }

  const elegibles = useMemo(() => {
    return movimientos.filter((mov) => {
      if (esMesActualMexico(mov.created_at)) return false;

      if (mov.status === "paid" || mov.status === "reversed") {
        return false;
      }

      if (tieneRetiroActivo(mov.id)) return false;
      if (tieneRetiroPagado(mov.id)) return false;

      return true;
    });
  }, [movimientos, aplicaciones]);

  const mesActual = useMemo(() => {
    return movimientos.filter(
      (mov) =>
        esMesActualMexico(mov.created_at) &&
        mov.status !== "reversed"
    );
  }, [movimientos]);

  const enProceso = useMemo(() => {
    return movimientos.filter((mov) =>
      tieneRetiroActivo(mov.id)
    );
  }, [movimientos, aplicaciones]);

  const pagados = useMemo(() => {
    return movimientos.filter(
      (mov) =>
        mov.status === "paid" ||
        tieneRetiroPagado(mov.id)
    );
  }, [movimientos, aplicaciones]);

  // ─────────────────────────────────────
  // MÉTRICAS
  // ─────────────────────────────────────

  const generado = movimientos
    .filter((m) => m.status !== "reversed")
    .reduce(
      (acc, mov) => acc + Number(mov.neto_establecimiento),
      0
    );

  const disponible = elegibles.reduce(
    (acc, mov) => acc + Number(mov.neto_establecimiento),
    0
  );

  const proceso = enProceso.reduce(
    (acc, mov) => acc + Number(mov.neto_establecimiento),
    0
  );

  const pagado = pagados.reduce(
    (acc, mov) => acc + Number(mov.neto_establecimiento),
    0
  );

  const generadoMesActual = mesActual.reduce(
    (acc, mov) => acc + Number(mov.neto_establecimiento),
    0
  );

  // ─────────────────────────────────────
  // FILTRO VISUAL
  // ─────────────────────────────────────

  const elegiblesFiltrados =
    filtroEstablecimiento === "all"
      ? elegibles
      : elegibles.filter(
          (m) => m.establecimiento_id === filtroEstablecimiento
        );

  const establecimientosConElegibles = establecimientos.filter((est) =>
    elegiblesFiltrados.some(
      (mov) => mov.establecimiento_id === est.uuid
    )
  );

  // ─────────────────────────────────────
  // SELECCIÓN
  // ─────────────────────────────────────

  function toggleMovimiento(id: number) {
    setSeleccionados((actual) =>
      actual.includes(id)
        ? actual.filter((x) => x !== id)
        : [...actual, id]
    );
  }

  function seleccionarEstablecimiento(uuid: string) {
    const ids = elegiblesFiltrados
      .filter((m) => m.establecimiento_id === uuid)
      .map((m) => m.id);

    const todosSeleccionados = ids.every((id) =>
      seleccionados.includes(id)
    );

    if (todosSeleccionados) {
      setSeleccionados((actual) =>
        actual.filter((id) => !ids.includes(id))
      );
    } else {
      setSeleccionados((actual) => [
        ...new Set([...actual, ...ids]),
      ]);
    }
  }

  function seleccionarTodosVisibles() {
    const ids = elegiblesFiltrados.map((m) => m.id);

    const todosSeleccionados =
      ids.length > 0 &&
      ids.every((id) => seleccionados.includes(id));

    if (todosSeleccionados) {
      setSeleccionados((actual) =>
        actual.filter((id) => !ids.includes(id))
      );
    } else {
      setSeleccionados((actual) => [
        ...new Set([...actual, ...ids]),
      ]);
    }
  }

  const movimientosSeleccionados = elegibles.filter((m) =>
    seleccionados.includes(m.id)
  );

  const totalSeleccionado = movimientosSeleccionados.reduce(
    (acc, mov) => acc + Number(mov.neto_establecimiento),
    0
  );

  const establecimientosSeleccionados = new Set(
    movimientosSeleccionados.map((m) => m.establecimiento_id)
  ).size;

  // ─────────────────────────────────────
  // SOLICITAR
  // ─────────────────────────────────────

  async function solicitarRetiro() {
    if (loadingRetiro || seleccionados.length === 0) return;

    setMensaje("");
    setLoadingRetiro(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMensaje("Tu sesión no es válida");
        return;
      }

      const res = await fetch("/api/orders/retiros/solicitar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          balance_movimiento_ids: seleccionados,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setMensaje(json.error || "No fue posible solicitar el retiro");
        return;
      }

      setMensaje(
        `✅ Solicitud creada por ${formatMoney(json.monto)}`
      );

      setSeleccionados([]);

      await cargarBalance();
    } catch (error) {
      console.error(error);
      setMensaje("No fue posible solicitar el retiro");
    } finally {
      setLoadingRetiro(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
        Cargando balance...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}

        <section className="bg-white border border-slate-200 rounded-3xl p-7 md:p-10 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-semibold">
                Logística fácil y sin dramas
              </p>

              <h1 className="text-4xl md:text-5xl font-bold text-[#1e3a8a] mt-3">
                Balance 💰
              </h1>

              <p className="text-slate-600 mt-4 max-w-2xl text-lg">
                Consulta lo que tus establecimientos han generado y
                selecciona los servicios que quieres retirar.
              </p>
            </div>

            <div className="w-full lg:w-72">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Filtrar establecimiento
              </label>

              <select
                value={filtroEstablecimiento}
                onChange={(e) =>
                  setFiltroEstablecimiento(e.target.value)
                }
                className="w-full h-12 rounded-xl border border-slate-300 bg-white px-4 text-sm"
              >
                <option value="all">
                  Todos los establecimientos
                </option>

                {establecimientos.map((est) => (
                  <option key={est.uuid} value={est.uuid}>
                    {est.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* MÉTRICAS */}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BalanceCard
            label="Generado"
            value={generado}
            description="Ingresos generados con Dropit"
            icon={<Wallet size={22} />}
          />

          <BalanceCard
            label="Disponible"
            value={disponible}
            description="Ya puedes solicitarlo"
            icon={<CheckCircle2 size={22} />}
          />

          <BalanceCard
            label="En proceso"
            value={proceso}
            description="Solicitudes pendientes de pago"
            icon={<Clock3 size={22} />}
          />

          <BalanceCard
            label="Pagado"
            value={pagado}
            description="Total depositado"
            icon={<PackageCheck size={22} />}
          />
        </section>

        {/* PRÓXIMO CIERRE */}

        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-500 font-semibold">
                Próximo cierre
              </p>

              <h2 className="text-2xl font-bold text-[#1e3a8a] mt-2">
                {mesActual.length} servicios generados este mes
              </h2>

              <p className="text-slate-600 mt-2">
                Estos servicios estarán disponibles para retiro cuando
                termine el mes.
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-slate-500">
                Generado este mes
              </p>

              <p className="text-3xl font-bold text-[#1e3a8a] mt-1">
                {formatMoney(generadoMesActual)}
              </p>
            </div>
          </div>
        </section>

        {/* DISPONIBLES */}

        <section className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">
                Servicios disponibles
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#1e3a8a] mt-2">
                Selecciona qué quieres retirar
              </h2>

              <p className="text-slate-500 mt-2">
                Puedes combinar pedidos de distintos establecimientos
                en una misma solicitud.
              </p>
            </div>

            {elegiblesFiltrados.length > 0 && (
              <button
                onClick={seleccionarTodosVisibles}
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                Seleccionar todos
              </button>
            )}
          </div>

          {elegiblesFiltrados.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No tienes servicios disponibles para retiro.
            </div>
          ) : (
            <div className="space-y-5">
              {establecimientosConElegibles.map((est) => {
                const movimientosEst = elegiblesFiltrados.filter(
                  (m) => m.establecimiento_id === est.uuid
                );

                const subtotal = movimientosEst.reduce(
                  (acc, m) =>
                    acc + Number(m.neto_establecimiento),
                  0
                );

                const todosSeleccionados = movimientosEst.every((m) =>
                  seleccionados.includes(m.id)
                );

                return (
                  <div
                    key={est.uuid}
                    className="border border-slate-200 rounded-2xl overflow-hidden"
                  >
                    <div className="bg-slate-50 px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={todosSeleccionados}
                          onChange={() =>
                            seleccionarEstablecimiento(est.uuid)
                          }
                          className="h-4 w-4"
                        />

                        <Building2
                          size={18}
                          className="text-blue-600"
                        />

                        <div>
                          <p className="font-semibold text-slate-800">
                            {est.nombre}
                          </p>

                          <p className="text-xs text-slate-500">
                            {movimientosEst.length} servicios disponibles
                          </p>
                        </div>
                      </div>

                      <p className="font-bold text-[#1e3a8a]">
                        {formatMoney(subtotal)}
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {movimientosEst.map((mov) => (
                        <label
                          key={mov.id}
                          className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={seleccionados.includes(mov.id)}
                            onChange={() =>
                              toggleMovimiento(mov.id)
                            }
                            className="h-4 w-4"
                          />

                          <div className="flex-1 grid md:grid-cols-3 gap-2 md:items-center">
                            <div>
                              <p className="font-semibold text-slate-800">
                                {mov.pedidos?.folio ||
                                  `Pedido #${mov.pedido_id}`}
                              </p>
                            </div>

                            <p className="text-sm text-slate-500">
                              {formatDate(mov.created_at)}
                            </p>

                            <p className="font-bold text-emerald-600 md:text-right">
                              {formatMoney(
                                mov.neto_establecimiento
                              )}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RESUMEN SOLICITUD */}

        <section className="sticky bottom-4 z-20">
          <div className="bg-[#172554] text-white rounded-3xl px-6 py-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-blue-200 text-sm">
                Solicitud de retiro
              </p>

              <p className="text-sm mt-1">
                {seleccionados.length} servicios ·{" "}
                {establecimientosSeleccionados} establecimientos
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="sm:text-right">
                <p className="text-xs text-blue-200">
                  Total a depositar
                </p>

                <p className="text-3xl font-bold">
                  {formatMoney(totalSeleccionado)}
                </p>
              </div>

              <Button
                onClick={solicitarRetiro}
                disabled={
                  seleccionados.length === 0 || loadingRetiro
                }
                className="h-12 px-7 rounded-xl bg-white text-[#1e3a8a] hover:bg-blue-50 font-bold disabled:opacity-50"
              >
                {loadingRetiro
                  ? "Procesando..."
                  : "Solicitar retiro"}
              </Button>
            </div>
          </div>
        </section>

        {mensaje && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium ${
              mensaje.startsWith("✅")
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}
          >
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="text-3xl font-bold text-[#1e3a8a] mt-2">
            {formatMoney(value)}
          </p>

          <p className="text-sm text-slate-500 mt-1">
            {description}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}