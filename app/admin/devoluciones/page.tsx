"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type EstadoDevolucion =
  | "devolucion_pendiente"
  | "devuelto"
  | "custodia_vencida";

type Devolucion = {
  id: number;
  folio: string;
  producto: string;
  estado: EstadoDevolucion;
  emailVendedor: string | null;

  establecimiento: {
    uuid: string;
    nombre: string;
    zona: string | null;
  } | null;

  devolucionIniciadaAt: string | null;
  devueltoAt: string | null;
  custodiaVencidaAt: string | null;
  createdAt: string;
};

type DevolucionesData = {
  resumen: {
    pendientes: number;
    devueltas: number;
    custodiaVencida: number;
  };

  devoluciones: Devolucion[];
};

type FiltroEstado = "todos" | EstadoDevolucion;

export default function AdminDevolucionesPage() {
  const [data, setData] = useState<DevolucionesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>(
    "devolucion_pendiente"
  );

  useEffect(() => {
    cargarDevoluciones();
  }, []);

  async function cargarDevoluciones() {
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

      const response = await fetch("/api/orders/admin/devoluciones", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData?.error ||
            "No fue posible cargar las devoluciones"
        );
      }

      setData(responseData);
    } catch (err) {
      console.error("Error cargando devoluciones admin:", err);

      setError(
        err instanceof Error
          ? err.message
          : "No fue posible cargar las devoluciones"
      );
    } finally {
      setLoading(false);
    }
  }

  const devolucionesFiltradas = useMemo(() => {
    if (!data) return [];

    if (filtro === "todos") {
      return data.devoluciones;
    }

    return data.devoluciones.filter(
      (devolucion) => devolucion.estado === filtro
    );
  }, [data, filtro]);

  if (loading && !data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* HEADER */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-8">
        <Link
          href="/admin"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#2563eb]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e3a8a] md:text-4xl">
            Devoluciones
          </h1>

          <p className="mt-2 text-slate-600">
            Seguimiento de pedidos dentro del flujo de devolución
          </p>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* RESUMEN */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResumenCard
          title="Pendientes"
          value={data.resumen.pendientes}
          description="Esperando devolución al vendedor"
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />

        <ResumenCard
          title="Devueltas"
          value={data.resumen.devueltas}
          description="Devoluciones completadas"
          icon={<CheckCircle2 className="h-5 w-5" />}
          tone="emerald"
        />

        <ResumenCard
          title="Custodia vencida"
          value={data.resumen.custodiaVencida}
          description="No recogidas dentro del plazo"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="red"
        />
      </section>

      {/* LISTADO */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e3a8a]">
              Operaciones
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Historial y pendientes del proceso de devolución
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Estado
            </p>

            <select
              value={filtro}
              onChange={(e) =>
                setFiltro(e.target.value as FiltroEstado)
              }
              className="min-w-52 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400"
            >
              <option value="devolucion_pendiente">
                Pendientes
              </option>

              <option value="devuelto">
                Devueltas
              </option>

              <option value="custodia_vencida">
                Custodia vencida
              </option>

              <option value="todos">
                Todos
              </option>
            </select>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          {devolucionesFiltradas.length > 0 ? (
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <TableHeader>Folio</TableHeader>
                  <TableHeader>Producto</TableHeader>
                  <TableHeader>Establecimiento</TableHeader>
                  <TableHeader>Zona</TableHeader>
                  <TableHeader>Inicio devolución</TableHeader>
                  <TableHeader>Plazo</TableHeader>
                  <TableHeader>Estado</TableHeader>
                </tr>
              </thead>

              <tbody>
                {devolucionesFiltradas.map((devolucion) => (
                  <tr
                    key={devolucion.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <TableCell>
                      <span className="font-bold text-[#1e3a8a]">
                        {devolucion.folio}
                      </span>
                    </TableCell>

                    <TableCell>
                      {devolucion.producto}
                    </TableCell>

                    <TableCell>
                      {devolucion.establecimiento?.nombre || "—"}
                    </TableCell>

                    <TableCell>
                      {devolucion.establecimiento?.zona || "—"}
                    </TableCell>

                    <TableCell>
                      {formatearFecha(
                        devolucion.devolucionIniciadaAt
                      )}
                    </TableCell>

                    <TableCell>
                      <PlazoDevolucion devolucion={devolucion} />
                    </TableCell>

                    <TableCell>
                      <EstadoBadge estado={devolucion.estado} />
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <Package className="h-8 w-8 text-slate-300" />

              <p className="mt-3 font-semibold text-slate-600">
                No hay devoluciones en este estado
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Las operaciones aparecerán aquí cuando entren al flujo.
              </p>
            </div>
          )}
        </div>
      </section>

      {loading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-[#1e40af] shadow-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Actualizando
        </div>
      )}
    </div>
  );
}

function ResumenCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone: "amber" | "emerald" | "red";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50 text-emerald-600"
      : tone === "red"
        ? "border-red-100 bg-red-50 text-red-600"
        : "border-amber-100 bg-amber-50 text-amber-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}
        >
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
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-4 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}

function EstadoBadge({
  estado,
}: {
  estado: EstadoDevolucion;
}) {
  const config =
    estado === "devuelto"
      ? {
          label: "Devuelto",
          className:
            "border-emerald-200 bg-emerald-50 text-emerald-700",
        }
      : estado === "custodia_vencida"
        ? {
            label: "Custodia vencida",
            className:
              "border-red-200 bg-red-50 text-red-700",
          }
        : {
            label: "Pendiente",
            className:
              "border-amber-200 bg-amber-50 text-amber-700",
          };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function PlazoDevolucion({
  devolucion,
}: {
  devolucion: Devolucion;
}) {
  if (devolucion.estado === "devuelto") {
    return (
      <span className="text-emerald-600">
        Completada
      </span>
    );
  }

  if (devolucion.estado === "custodia_vencida") {
    return (
      <span className="font-semibold text-red-600">
        Vencido
      </span>
    );
  }

  if (!devolucion.devolucionIniciadaAt) {
    return <span>—</span>;
  }

  const inicio = new Date(
    devolucion.devolucionIniciadaAt
  ).getTime();

  const limite = inicio + 48 * 60 * 60 * 1000;
  const restante = limite - Date.now();

  if (restante <= 0) {
    return (
      <span className="font-semibold text-red-600">
        Plazo vencido
      </span>
    );
  }

  const horas = Math.floor(
    restante / (60 * 60 * 1000)
  );

  const minutos = Math.floor(
    (restante % (60 * 60 * 1000)) /
      (60 * 1000)
  );

  return (
    <span className="font-semibold text-amber-600">
      {horas}h {minutos}m
    </span>
  );
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "—";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha));
}