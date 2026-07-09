"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  Bell,
  Store,
  Eye,
} from "lucide-react";

export default function EstablecimientoEstadoPage() {
  const router = useRouter();
  const pendientesRef = useRef(null);

  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstId, setSelectedEstId] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [pendientesGlobales, setPendientesGlobales] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    transito: 0,
    entregados: 0,
  });

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const userId = session?.user?.id;

        if (!userId) return;

        const { data, error } = await supabase
          .from("establecimientos")
          .select("*")
          .eq("usuario_id", userId);

        if (error) {
          console.error(error);
          setLoadingInicial(false);
          return;
        }

        const establecimientosData = data || [];
        setEstablecimientos(establecimientosData);

        if (establecimientosData.length > 0) {
          const firstId = establecimientosData[0].uuid;

          setSelectedEstId((prev) => {
            if (prev) return prev;
            return firstId;
          });

          const { data: pedidosData } = await supabase
            .from("pedidos")
            .select(`
              id,
              folio,
              estado,
              email_vendedor,
              vendedor_id,
              establecimiento_uuid,
              created_at
            `)
            .eq("establecimiento_uuid", firstId);

          const list = pedidosData || [];
          setPedidos(list);

          setStats({
            total: list.length,
            pendientes: list.filter(
              (p) => p.estado === "pendiente_aprobacion_establecimiento"
            ).length,
            transito: list.filter((p) => p.estado === "en_transito").length,
            entregados: list.filter((p) => p.estado === "entregado").length,
          });
        }

        setLoadingInicial(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!selectedEstId) return;

    const cargarPedidos = async () => {
      const { data } = await supabase
        .from("pedidos")
        .select(`
          id,
          folio,
          estado,
          email_vendedor,
          vendedor_id,
          establecimiento_uuid,
          created_at
        `)
        .eq("establecimiento_uuid", selectedEstId);

      const list = data || [];
      setPedidos(list);

      setStats({
        total: list.length,
        pendientes: list.filter(
          (p) => p.estado === "pendiente_aprobacion_establecimiento"
        ).length,
        transito: list.filter((p) => p.estado === "en_transito").length,
        entregados: list.filter((p) => p.estado === "entregado").length,
      });
    };

    cargarPedidos();
  }, [selectedEstId]);

  useEffect(() => {
    const cargarPendientesGlobales = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) return;

      const { data: ests } = await supabase
        .from("establecimientos")
        .select("uuid")
        .eq("usuario_id", userId);

      const uuids = ests?.map((e) => e.uuid) || [];

      if (uuids.length === 0) {
        setPendientesGlobales([]);
        return;
      }

      const { data } = await supabase
        .from("pedidos")
        .select("id, establecimiento_uuid")
        .in("establecimiento_uuid", uuids)
        .eq("estado", "pendiente_aprobacion_establecimiento");

      setPendientesGlobales(data || []);
    };

    cargarPendientesGlobales();
    const interval = setInterval(cargarPendientesGlobales, 15000);

    return () => clearInterval(interval);
  }, []);

  const pendientes = pedidos.filter(
    (p) => p.estado === "pendiente_aprobacion_establecimiento"
  );

  const selectedEstablecimiento = establecimientos.find(
    (e) => e.uuid === selectedEstId
  );

  const irAPendientesGlobales = () => {
    const pendiente = pendientesGlobales[0];

    if (!pendiente?.establecimiento_uuid) return;

    setSelectedEstId(pendiente.establecimiento_uuid);

    setTimeout(() => {
      pendientesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  };

  if (loadingInicial) {
    return (
      <div className="min-h-screen bg-slate-50 px-5 py-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
          Cargando panel...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12 pb-36">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-[#1e3a8a] md:text-5xl">
                Panel del establecimiento 🏪
              </h1>

              <p className="mt-4 max-w-2xl text-lg text-slate-600">
                Gestiona pedidos, revisa aprobaciones y mantén tu operación en
                tiempo real.
              </p>
            </div>

            {pendientesGlobales.length > 0 && (
              <button
                onClick={irAPendientesGlobales}
                className="flex w-fit items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 font-semibold text-amber-700 transition hover:bg-amber-100"
              >
                <Bell size={20} />
                {pendientesGlobales.length} por revisar
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard
            icon={<Package size={20} />}
            label="Total"
            value={stats.total}
            tone="blue"
          />

          <MetricCard
            icon={<Clock size={20} />}
            label="Por aprobar"
            value={stats.pendientes}
            tone="amber"
          />

          <MetricCard
            icon={<Truck size={20} />}
            label="En tránsito"
            value={stats.transito}
            tone="purple"
          />

          <MetricCard
            icon={<CheckCircle size={20} />}
            label="Entregados"
            value={stats.entregados}
            tone="emerald"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563eb]">
              <Store size={20} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Estas revisando este establecimiento:
              </p>
              <h2 className="font-bold text-[#1e3a8a]">
                {selectedEstablecimiento?.nombre || "Selecciona establecimiento"}
              </h2>
            </div>
          </div>

          <select
            className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
            value={selectedEstId || ""}
            onChange={(e) => setSelectedEstId(e.target.value)}
          >
            {establecimientos.map((e) => (
              <option key={e.uuid} value={e.uuid}>
                {e.nombre}
              </option>
            ))}
          </select>
        </section>

        {pendientes.length > 0 && (
          <section
            ref={pendientesRef}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Acción requerida
                </p>
                <h2 className="mt-1 text-xl font-bold text-[#1e3a8a]">
                  Pendientes de aprobación
                </h2>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {pendientes.length} pendientes
              </span>
            </div>

            <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2">
              {pendientes.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/establecimiento/aprobar/${p.id}`)}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1e3a8a]">
                      {p.folio}
                    </p>

                    <span className="mt-2 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      Esperando aprobación
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/establecimiento/aprobar/${p.id}`);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
                  >
                    <Eye size={15} />
                    Revisar
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Pedidos
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#1e3a8a]">
                Todos los pedidos
              </h2>
            </div>

            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
              {pedidos.length} registros
            </span>
          </div>

          <div className="max-h-[320px] space-y-3 overflow-y-auto pr-2">
            {pedidos.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                No hay pedidos registrados para este establecimiento.
              </div>
            )}

            {pedidos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#1e3a8a]">
                    {p.folio}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <EstadoBadge estado={p.estado} />

                    <span className="text-xs text-slate-400">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone }) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-50 text-amber-600 border-amber-100"
      : tone === "purple"
      ? "bg-purple-50 text-purple-600 border-purple-100"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-blue-50 text-[#2563eb] border-blue-100";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass}`}
        >
          {icon}
        </div>

        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>

      <p className="text-3xl font-bold text-[#1e3a8a]">{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const styles =
    estado === "pendiente_aprobacion_establecimiento"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : estado === "pendiente_recoleccion"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
      : estado === "en_transito"
      ? "bg-blue-50 text-[#2563eb] border-blue-100"
      : estado === "entregado"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {estado?.replaceAll("_", " ")}
    </span>
  );
}