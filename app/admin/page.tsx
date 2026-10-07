"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  Package,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Store,
  DollarSign,
  Clock,
  AlertTriangle,
  Coins,
  Map,
  Users,
  Headphones,
  ChartNoAxesCombined,
  Truck,
PackageCheck,
} from "lucide-react";
import Link from "next/link";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Periodo = "7d" | "30d" | "90d" | "all";

type DashboardData = {
  filtros: {
    periodo: Periodo;
    zona: string;
  };

  kpis: {
  pedidos: number;
  pendientesAceptacion: number;
  enTransito: number;
  pendientesRecoleccion: number;
  entregados: number;
  tasaEntrega: number;
  tasaDevolucion: number;
  tasaCancelacion: number;
  establecimientosActivos: number;
  valorGenerado: number;
};

finanzas: {
  brutoGenerado: number;
  comisionDropit: number;
  ivaComision: number;
  cargoDropit: number
  netoEstablecimientos: number;
  pagado: number;
  pendientePorPagar: number;
  disponible: number;
  retiroEnProceso: number;
};

control: {
  pendienteFacturaMonto: number;
  pendienteFacturaOperaciones: number;
  facturasProcesando: number;
  facturasConError: number;
  pedidosCancelados: number;
  coinsReintegradas: number;
  cancelacionesSinReintegro: number;
  movimientosRevertidosMonto: number;
  movimientosRevertidosOperaciones: number;
};

  atencion: {
    retirosPendientes: number;
    devolucionesPendientes: number;
  };

  graficas: {
    pedidosTiempo: {
      fecha: string;
      cantidad: number;
    }[];

    pedidosEstado: {
      estado: string;
      cantidad: number;
    }[];
  };

  zonas: string[];
};

export default function AdminHome() {
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [zona, setZona] = useState("all");

  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDashboard();
  }, [periodo, zona]);

  async function cargarDashboard() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("No hay una sesión activa.");
        return;
      }

      const params = new URLSearchParams({
        period: periodo,
        zona,
      });

      const response = await fetch(
        `/api/orders/admin/dashboard?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data?.error || "No fue posible cargar el dashboard"
        );
      }

      setDashboard(data);
    } catch (err) {
      console.error("Error cargando dashboard admin:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar el dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  if (loading && !dashboard) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) return null;

  const { kpis, finanzas, control, atencion, zonas } = dashboard;

  return (
    <div className="mx-auto max-w-7xl space-y-8">

      {/* HEADER */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#1e3a8a] md:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 text-slate-600">
              Resumen de la operación de Dropit
            </p>
          </div>

          {/* FILTROS */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Periodo
              </p>

              <select
                value={periodo}
                onChange={(e) =>
                  setPeriodo(e.target.value as Periodo)
                }
                className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              >
                <option value="7d">7 días</option>
                <option value="30d">30 días</option>
                <option value="90d">90 días</option>
                <option value="all">Todo</option>
              </select>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Zona
              </p>

              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="min-w-40 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
              >
                <option value="all">Todas</option>

                {zonas.map((zonaDisponible) => (
                  <option
                    key={zonaDisponible}
                    value={zonaDisponible}
                  >
                    {zonaDisponible}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

     {/* TUBERÍA OPERATIVA */}
<section className="space-y-4">
  <div>
    <h2 className="text-xl font-bold text-[#1e3a8a]">
      Tubería de pedidos
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Estado actual de los pedidos creados en el periodo seleccionado
    </p>
  </div>

  {/* FLUJO PRINCIPAL */}
  <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
    <PipelineCard
      title="Creados"
      value={kpis.pedidos}
      icon={<Package className="h-5 w-5" />}
      first
    />

    <PipelineCard
      title="Pend. aceptación"
      value={kpis.pendientesAceptacion}
      icon={<Clock className="h-5 w-5" />}
    />

    <PipelineCard
      title="En tránsito"
      value={kpis.enTransito}
      icon={<Truck className="h-5 w-5" />}
    />

    <PipelineCard
      title="Pend. recolección"
      value={kpis.pendientesRecoleccion}
      icon={<PackageCheck className="h-5 w-5" />}
    />

    <PipelineCard
      title="Entregados"
      value={kpis.entregados}
      icon={<CheckCircle2 className="h-5 w-5" />}
      last
    />
  </div>

  {/* INDICADORES */}
  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
    <RateCard
      title="Tasa de entrega"
      value={`${kpis.tasaEntrega}%`}
      icon={<CheckCircle2 className="h-5 w-5" />}
      tone="emerald"
    />

    <RateCard
      title="Tasa de devolución"
      value={`${kpis.tasaDevolucion}%`}
      icon={<RotateCcw className="h-5 w-5" />}
      tone="amber"
    />

    <RateCard
      title="Tasa de cancelación"
      value={`${kpis.tasaCancelacion}%`}
      icon={<XCircle className="h-5 w-5" />}
      tone="red"
    />
  </div>
</section>

      {/* GRÁFICAS */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* EVOLUCIÓN */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#1e3a8a]">
              Evolución de pedidos
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pedidos creados durante el periodo seleccionado
            </p>
          </div>

          <div className="mt-5 h-[260px] w-full">
  {dashboard.graficas.pedidosTiempo.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={dashboard.graficas.pedidosTiempo}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e2e8f0"
        />

        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip />

        <Line
          type="monotone"
          dataKey="cantidad"
          stroke="#2563eb"
          strokeWidth={3}
          dot={{
            r: 4,
            fill: "#2563eb",
            strokeWidth: 0,
          }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
      <p className="text-sm text-slate-400">
        Sin pedidos en el periodo seleccionado
      </p>
    </div>
  )}
</div>
</div>

        {/* ESTADOS */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#1e3a8a]">
              Distribución por estado
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Estado actual de los pedidos del periodo
            </p>
          </div>

          <div className="mt-5 h-[260px] w-full">
  {dashboard.graficas.pedidosEstado.length > 0 ? (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={dashboard.graficas.pedidosEstado.map((item) => ({
          ...item,
          estadoLabel: formatearEstado(item.estado),
        }))}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 30, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="#e2e8f0"
        />

        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />

        <YAxis
          type="category"
          dataKey="estadoLabel"
          width={130}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />

        <Tooltip />

        <Bar
          dataKey="cantidad"
          fill="#2563eb"
          radius={[0, 8, 8, 0]}
          barSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  ) : (
    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
      <p className="text-sm text-slate-400">
        Sin pedidos en el periodo seleccionado
      </p>
    </div>
  )}
</div>
        </div>

      </section>

      {/* FINANZAS */}
<section className="space-y-4">
  <div>
    <h2 className="text-xl font-bold text-[#1e3a8a]">
      Finanzas
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Flujo económico de los servicios del periodo seleccionado
    </p>
  </div>

  {/* RESULTADO ECONÓMICO */}
  
  {/* RESULTADO ECONÓMICO */}
<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
  <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
    <FinancialStep
      title="Bruto generado"
      value={formatearMoneda(finanzas.brutoGenerado)}
      description="Valor total del servicio"
      icon={<DollarSign className="h-5 w-5" />}
    />

    <FinancialOperator symbol="→" />

    <FinancialStep
      title="Comisión Dropit"
      value={formatearMoneda(finanzas.comisionDropit)}
      description="Ingreso antes de IVA"
      icon={<ChartNoAxesCombined className="h-5 w-5" />}
    />

    <FinancialOperator symbol="+" />

    <FinancialStep
      title="IVA comisión"
      value={formatearMoneda(finanzas.ivaComision)}
      description="IVA sobre la comisión"
      icon={<DollarSign className="h-5 w-5" />}
    />

    <FinancialOperator symbol="=" />

    <FinancialStep
      title="Cargo Dropit"
      value={formatearMoneda(finanzas.cargoDropit)}
      description="Comisión + IVA"
      icon={<ChartNoAxesCombined className="h-5 w-5" />}
      highlighted
    />
  </div>

  <div className="mt-4 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 px-5 py-4">
    <div>
      <p className="text-sm font-bold text-[#1e3a8a]">
        Neto establecimientos
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Bruto generado menos cargo Dropit
      </p>
    </div>

    <p className="text-2xl font-bold text-[#1e3a8a]">
      {formatearMoneda(finanzas.netoEstablecimientos)}
    </p>
  </div>
</div>

{/* DESTINO DEL NETO */}

  {/* DESTINO DEL NETO */}
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
    <div className="mb-5">
      <h3 className="font-bold text-[#1e3a8a]">
        Destino del neto
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        Conciliación del monto correspondiente a establecimientos
      </p>
    </div>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <MoneyStatus
        title="Pagado"
        value={formatearMoneda(finanzas.pagado)}
        description="Liquidado a establecimientos"
        tone="emerald"
      />

      <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-600">
              Pendiente por pagar
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Neto aún no liquidado
            </p>
          </div>

          <p className="text-2xl font-bold text-[#1e3a8a]">
            {formatearMoneda(finanzas.pendientePorPagar)}
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">
              Disponible
            </p>

            <p className="mt-1 text-lg font-bold text-[#1e3a8a]">
              {formatearMoneda(finanzas.disponible)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium text-slate-400">
              Retiro en proceso
            </p>

            <p className="mt-1 text-lg font-bold text-[#1e3a8a]">
              {formatearMoneda(finanzas.retiroEnProceso)}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>

 {/* CONTROL FINANCIERO */}
<div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
  <div className="mb-5">
    <h3 className="font-bold text-[#1e3a8a]">
      Control financiero
    </h3>

    <p className="mt-1 text-sm text-slate-500">
      Pendientes, reintegros y movimientos que requieren seguimiento
    </p>
  </div>

  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {/* FACTURACIÓN */}
    <div
      className={`rounded-2xl border p-5 ${
        control.facturasConError > 0
          ? "border-red-200 bg-red-50/50"
          : control.pendienteFacturaOperaciones > 0
            ? "border-amber-200 bg-amber-50/50"
            : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#1e3a8a]">
            Facturación establecimientos
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Documentos pendientes del periodo
          </p>
        </div>

        <span className="text-xl font-bold text-[#1e3a8a]">
          {formatearMoneda(control.pendienteFacturaMonto)}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <ControlMiniMetric
          label="Pendientes"
          value={control.pendienteFacturaOperaciones}
        />

        <ControlMiniMetric
          label="Procesando"
          value={control.facturasProcesando}
        />

        <ControlMiniMetric
          label="Con error"
          value={control.facturasConError}
          alert={control.facturasConError > 0}
        />
      </div>
    </div>

    {/* CANCELACIONES */}
    <div
      className={`rounded-2xl border p-5 ${
        control.cancelacionesSinReintegro > 0
          ? "border-amber-200 bg-amber-50/50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-sm font-bold text-[#1e3a8a]">
        Cancelaciones / reintegros
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Control de devolución de Coins
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <ControlMiniMetric
          label="Cancelados"
          value={control.pedidosCancelados}
        />

        <ControlMiniMetric
          label="Reintegradas"
          value={control.coinsReintegradas}
        />

        <ControlMiniMetric
          label="Sin reintegro"
          value={control.cancelacionesSinReintegro}
          alert={control.cancelacionesSinReintegro > 0}
        />
      </div>
    </div>

    {/* REVERSIONES */}
    <div
      className={`rounded-2xl border p-5 ${
        control.movimientosRevertidosOperaciones > 0
          ? "border-amber-200 bg-amber-50/50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#1e3a8a]">
            Pagos revertidos
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Operaciones financieras revertidas
          </p>
        </div>

        <span className="text-xl font-bold text-[#1e3a8a]">
          {formatearMoneda(control.movimientosRevertidosMonto)}
        </span>
      </div>

      <div className="mt-5">
        <ControlMiniMetric
          label="Operaciones"
          value={control.movimientosRevertidosOperaciones}
        />
      </div>
    </div>
  </div>
</div>
</section>

      {/* REQUIEREN ATENCIÓN */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1e3a8a]">
            Requieren atención
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Pendientes actuales de la operación
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <AttentionCard
            title="Retiros"
            value={atencion.retirosPendientes}
            description="Pendientes o aprobados"
            href="/admin/retiros"
            icon={<Clock className="h-5 w-5" />}
          />

          <AttentionCard
            title="Devoluciones"
            value={atencion.devolucionesPendientes}
            description="Pendientes de completar"
            icon={<AlertTriangle className="h-5 w-5" />}
          />

          <ComingSoonCard
            title="Soporte"
            description="Quejas, sugerencias y seguimiento"
            icon={<Headphones className="h-5 w-5" />}
          />

        </div>
      </section>

      {/* GESTIÓN */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#1e3a8a]">
            Gestión
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Herramientas administrativas
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

          <ManagementCard
            title="Establecimientos"
            href="/admin/establecimientos"
            icon={<Store className="h-5 w-5" />}
          />

          <ManagementCard
            title="Retiros"
            href="/admin/retiros"
            icon={<DollarSign className="h-5 w-5" />}
          />

          <ManagementCard
            title="Usuarios"
            href="/admin/usuarios"
            icon={<Users className="h-5 w-5" />}
          />

          <ManagementCard
            title="Coins"
            href="/admin/coins"
            icon={<Coins className="h-5 w-5" />}
          />

          <ManagementCard
            title="Mapa"
            href="/admin/mapa"
            icon={<Map className="h-5 w-5" />}
          />

          <ComingSoonManagementCard
            title="Soporte"
            icon={<Headphones className="h-5 w-5" />}
          />

          <ComingSoonManagementCard
            title="P&L"
            icon={<ChartNoAxesCombined className="h-5 w-5" />}
          />

        </div>
      </section>

      {/* LOADING DE ACTUALIZACIÓN */}
      {loading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-[#1e40af] shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando
        </div>
      )}

        </div>
  );
}

function PipelineCard({
  title,
  value,
  icon,
  first = false,
  last = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div className="relative rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      {!last && (
        <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-blue-100 bg-blue-50 px-1.5 text-sm font-bold text-[#2563eb] md:flex">
          →
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            last
              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
              : first
                ? "border-blue-200 bg-blue-100 text-[#2563eb]"
                : "border-blue-100 bg-blue-50 text-[#2563eb]"
          }`}
        >
          {icon}
        </div>

        <span className="text-3xl font-bold text-[#1e3a8a]">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-600">
        {title}
      </p>
    </div>
  );
}

function RateCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "amber" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-600"
      : tone === "amber"
        ? "border-amber-100 bg-amber-50 text-amber-600"
        : "border-red-100 bg-red-50 text-red-600";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}
        >
          {icon}
        </div>

        <p className="text-sm font-semibold text-slate-600">
          {title}
        </p>
      </div>

      <p className="text-2xl font-bold text-[#1e3a8a]">
        {value}
      </p>
    </div>
  );
}

function AttentionCard({
  title,
  value,
  description,
  href,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  href?: string;
  icon: React.ReactNode;
}) {
  const content = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
          {icon}
        </div>

        <span className="text-3xl font-bold text-[#1e3a8a]">
          {value}
        </span>
      </div>

      <h3 className="mt-4 font-bold text-[#1e3a8a]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );

  if (!href) return content;

  return <Link href={href}>{content}</Link>;
}

function ComingSoonCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#2563eb]">
          {icon}
        </div>

        <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#2563eb]">
          Próximamente
        </span>
      </div>

      <h3 className="mt-4 font-bold text-[#1e3a8a]">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ManagementCard({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:border-blue-200 hover:text-[#1e40af] hover:shadow-md"
    >
      <span className="text-[#2563eb]">
        {icon}
      </span>

      {title}
    </Link>
  );
}

function ComingSoonManagementCard({
  title,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-blue-100 bg-blue-50/40 px-4 py-4">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <span className="text-[#2563eb]">
          {icon}
        </span>

        {title}
      </div>

      <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-400">
        Próximamente
      </span>
    </div>
  );
}

function FinancialStep({
  title,
  value,
  description,
  icon,
  highlighted = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlighted
          ? "border-blue-200 bg-blue-50"
          : "border-slate-200 bg-slate-50/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-white text-[#2563eb]">
          {icon}
        </div>

        <p className="text-xl font-bold text-[#1e3a8a]">
          {value}
        </p>
      </div>

      <p className="mt-4 text-sm font-bold text-[#1e3a8a]">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function FinancialOperator({
  symbol,
}: {
  symbol: string;
}) {
  return (
    <div className="flex items-center justify-center text-xl font-bold text-[#2563eb]">
      {symbol}
    </div>
  );
}

function FinancialMetric({
  title,
  value,
  description,
  icon,
  highlighted = false,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlighted
          ? "border-blue-200 bg-blue-50/60"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            highlighted
              ? "border-blue-200 bg-white text-[#2563eb]"
              : "border-blue-100 bg-blue-50 text-[#2563eb]"
          }`}
        >
          {icon}
        </div>

        <p className="text-2xl font-bold text-[#1e3a8a]">
          {value}
        </p>
      </div>

      <h3 className="mt-4 font-bold text-[#1e3a8a]">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function MoneyStatus({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: "emerald" | "blue";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50"
      : "border-blue-100 bg-blue-50";

  return (
    <div className={`rounded-2xl border p-5 ${toneClass}`}>
      <p className="text-sm font-semibold text-slate-600">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-[#1e3a8a]">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ControlMiniMetric({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-3 ${
        alert ? "border-red-200" : "border-slate-200"
      }`}
    >
      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${
          alert ? "text-red-600" : "text-[#1e3a8a]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ControlMetric({
  title,
  value,
  detail,
  warning,
}: {
  title: string;
  value: string;
  detail: string;
  warning?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-600">
        {title}
      </p>

      <p className="mt-3 text-2xl font-bold text-[#1e3a8a]">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>

      {warning && (
        <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          {warning}
        </div>
      )}
    </div>
  );
}

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

function formatearEstado(estado: string) {
  return estado
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}