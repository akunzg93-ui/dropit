"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import OnboardingModal from "@/components/ui/OnboardingModal";
import {
  Package,
  PackageCheck,
  Send,
  Clock,
  Truck,
  CheckCircle,
  Bell,
  Store,
  Eye,
  ReceiptText,
  Plus,
  Settings,
  MapPin,
} from "lucide-react";

export default function EstablecimientoEstadoPage() {
  const router = useRouter();
  const pendientesRef = useRef(null);

  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstId, setSelectedEstId] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [pendientesGlobales, setPendientesGlobales] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState(0);
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
const [onboardingCargado, setOnboardingCargado] = useState(false);
const [pasoOnboarding, setPasoOnboarding] = useState(1);

  const [stats, setStats] = useState({
  pendientes: 0,
  transito: 0,
  porEntregar: 0,
  entregados: 0,
  devolucionesPendientes: 0,
  devueltos: 0,
  custodiaVencida: 0,
});

  useEffect(() => {
  let activo = true;

  const cargarInicial = async (session) => {
    const userId = session?.user?.id;

    if (!userId) {
      if (activo) setLoadingInicial(false);
      return;
    }

    const { data: onboarding, error: onboardingError } = await supabase
  .from("user_onboarding")
  .select("status")
  .eq("user_id", userId)
  .eq("feature", "establishment_panel")
  .eq("version", 1)
  .maybeSingle();

if (!activo) return;

if (onboardingError) {
  console.error(
    "Error cargando onboarding del establecimiento:",
    onboardingError
  );
} else {
  setMostrarOnboarding(!onboarding);
}

setOnboardingCargado(true);

    const { data, error } = await supabase
      .from("establecimientos")
      .select("*")
      .eq("usuario_id", userId);

    if (!activo) return;

    if (error) {
      console.error(error);
      setLoadingInicial(false);
      return;
    }

    const establecimientosData = data || [];
    setEstablecimientos(establecimientosData);

    if (establecimientosData.length > 0) {
      setSelectedEstId((prev) => {
        if (prev) return prev;
        return establecimientosData[0].uuid;
      });
    }

    setLoadingInicial(false);
  };

  const iniciar = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await cargarInicial(session);
  };

  iniciar();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      if (activo) {
        cargarInicial(session);
      }
    }, 0);
  });

  return () => {
    activo = false;
    subscription.unsubscribe();
  };
}, []);

const guardarEstadoOnboarding = async (status) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("No se pudo identificar al usuario.");
      return false;
    }

    const { error } = await supabase
      .from("user_onboarding")
      .upsert(
        {
          user_id: user.id,
          feature: "establishment_panel",
          version: 1,
          status,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,feature,version",
        }
      );

    if (error) {
      console.error(
        "Error guardando onboarding del establecimiento:",
        error
      );
      return false;
    }

    setMostrarOnboarding(false);
    return true;
  } catch (error) {
    console.error(
      "Error guardando onboarding del establecimiento:",
      error
    );
    return false;
  }
};

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
  pendientes: list.filter(
    (p) => p.estado === "pendiente_aprobacion_establecimiento"
  ).length,

  transito: list.filter(
    (p) => p.estado === "en_transito"
  ).length,

  porEntregar: list.filter(
    (p) => p.estado === "pendiente_recoleccion"
  ).length,

  entregados: list.filter(
    (p) => p.estado === "entregado"
  ).length,

  devolucionesPendientes: list.filter(
    (p) => p.estado === "devolucion_pendiente"
  ).length,

  devueltos: list.filter(
    (p) => p.estado === "devuelto"
  ).length,

  custodiaVencida: list.filter(
    (p) => p.estado === "custodia_vencida"
  ).length,
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

  useEffect(() => {
  const cargarFacturasPendientes = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) return;

    try {
      const response = await fetch(
        "/api/orders/billing/establishment-invoices",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Error cargando facturas pendientes:",
          data
        );
        return;
      }

      setFacturasPendientes(
        Number(data?.pending_count || 0)
      );
    } catch (error) {
      console.error(
        "Error cargando facturas pendientes:",
        error
      );
    }
  };

  cargarFacturasPendientes();

  const interval = setInterval(
    cargarFacturasPendientes,
    15000
  );

  return () => clearInterval(interval);
}, []);


  const pendientes = pedidos.filter(
    (p) => p.estado === "pendiente_aprobacion_establecimiento"
  );

  const pedidosFiltrados =
  estadoFiltro === "todos"
    ? pedidos
    : pedidos.filter(
        (p) => p.estado === estadoFiltro
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
      {onboardingCargado && mostrarOnboarding && (
  <OnboardingModal
    title={
      pasoOnboarding === 1
        ? "Bienvenido a Dropit"
        : pasoOnboarding === 2
        ? "Así funciona un pedido"
        : "Recibe y entrega paquetes"
    }
    subtitle={
      pasoOnboarding === 1
        ? "Conoce rápidamente cómo administrar tu establecimiento desde el panel."
        : pasoOnboarding === 2
        ? "Cada pedido avanza por etapas para que siempre sepas qué debes hacer."
        : "Usa los códigos de cada pedido para validar la recepción y la entrega."
    }
    step={pasoOnboarding}
    totalSteps={3}
    onSkip={() => guardarEstadoOnboarding("skipped")}
    onBack={() =>
      setPasoOnboarding((prev) => Math.max(1, prev - 1))
    }
    onNext={() =>
      setPasoOnboarding((prev) => Math.min(3, prev + 1))
    }
    onFinish={() => guardarEstadoOnboarding("completed")}
  >
    {pasoOnboarding === 1 && (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
            <Store size={38} />
          </div>

          <h3 className="mt-5 text-2xl font-extrabold text-[#1e3a8a]">
            Tu centro de operación
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Desde aquí puedes revisar el estado de tus pedidos y saber qué
            requiere tu atención.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {[
            ["🔔", "Revisa pendientes", "Identifica rápidamente los pedidos que necesitan una acción."],
            ["📦", "Gestiona pedidos", "Consulta el avance de cada paquete desde un solo lugar."],
            ["🏪", "Administra tu operación", "Mantén organizada la actividad de tu establecimiento."],
          ].map(([emoji, title, text]) => (
            <div
              key={title}
              className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center"
            >
              <div className="text-3xl">{emoji}</div>
              <p className="mt-2 font-bold text-[#1e3a8a]">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </div>
    )}

    {pasoOnboarding === 2 && (
      <div>
        <h3 className="text-center text-2xl font-extrabold text-[#1e3a8a]">
          El recorrido de cada pedido
        </h3>

        <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
          El panel organiza los pedidos según la etapa en la que se encuentran.
        </p>

        <div className="mt-7 grid gap-3 md:grid-cols-4">
          {[
            ["1", "Por aprobar", "Revisa y acepta el pedido."],
            ["2", "En tránsito", "El vendedor lleva el paquete."],
            ["3", "Por entregar", "El paquete está bajo tu resguardo."],
            ["4", "Entregado", "La entrega quedó completada."],
          ].map(([number, title, text]) => (
            <div
              key={title}
              className="relative rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm"
            >
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#2563eb] font-bold text-white">
                {number}
              </div>

              <p className="mt-3 font-bold text-[#1e3a8a]">{title}</p>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center text-sm text-blue-800">
          💡 El panel te mostrará cuántos pedidos tienes en cada etapa.
        </div>
      </div>
    )}

    {pasoOnboarding === 3 && (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-[#2563eb]">
            <Package size={38} />
          </div>

          <h3 className="mt-5 text-2xl font-extrabold text-[#1e3a8a]">
            Valida cada movimiento
          </h3>

          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Dropit te guía cuando recibes un paquete y cuando lo entregas.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#2563eb]">
  <PackageCheck size={23} />
</div>
            <p className="mt-3 text-lg font-bold text-[#1e3a8a]">
              Recibir paquete
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Valida el pedido antes de confirmar que el paquete quedó bajo
              resguardo del establecimiento.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#2563eb]">
  <Send size={22} />
</div>
            <p className="mt-3 text-lg font-bold text-[#1e3a8a]">
              Entregar paquete
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Confirma el pedido antes de completar la entrega al cliente.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-center text-sm text-blue-800">
          💡 Siempre podrás consultar el estado del pedido desde tu panel.
        </div>
      </div>
    )}
  </OnboardingModal>
)}
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

           <div className="flex flex-wrap items-center gap-3">
  {facturasPendientes > 0 && (
    <button
      onClick={() =>
        router.push("/establecimiento/facturacion")
      }
      className="flex w-fit items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 font-semibold text-blue-700 transition hover:bg-blue-100"
    >
      <ReceiptText size={20} />

      {facturasPendientes === 1
        ? "1 factura pendiente"
        : `${facturasPendientes} facturas pendientes`}
    </button>
  )}

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
          </div>
        </section>

        {/* MINI TUBERÍA OPERATIVA */}
<section className="space-y-3">
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    <PipelineMetric
      icon={<Clock size={20} />}
      label="Por aprobar"
      value={stats.pendientes}
      onClick={() =>
        setEstadoFiltro("pendiente_aprobacion_establecimiento")
      }
      active={
        estadoFiltro === "pendiente_aprobacion_establecimiento"
      }
      first
    />

    <PipelineMetric
      icon={<Truck size={20} />}
      label="En tránsito"
      value={stats.transito}
      onClick={() => setEstadoFiltro("en_transito")}
      active={estadoFiltro === "en_transito"}
    />

    <PipelineMetric
      icon={<Package size={20} />}
      label="Por entregar"
      value={stats.porEntregar}
      onClick={() => setEstadoFiltro("pendiente_recoleccion")}
      active={estadoFiltro === "pendiente_recoleccion"}
    />

    <PipelineMetric
      icon={<CheckCircle size={20} />}
      label="Entregados"
      value={stats.entregados}
      onClick={() => setEstadoFiltro("entregado")}
      active={estadoFiltro === "entregado"}
      last
    />
  </div>

  <div className="flex flex-wrap items-center gap-3">
    <button
      type="button"
      onClick={() => setEstadoFiltro("devolucion_pendiente")}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        estadoFiltro === "devolucion_pendiente"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-amber-200"
      }`}
    >
      Devoluciones pendientes
      <span className="font-bold">
        {stats.devolucionesPendientes}
      </span>
    </button>

    <button
      type="button"
      onClick={() => setEstadoFiltro("devuelto")}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        estadoFiltro === "devuelto"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200"
      }`}
    >
      Devueltos
      <span className="font-bold">{stats.devueltos}</span>
    </button>

    <button
      type="button"
      onClick={() => setEstadoFiltro("custodia_vencida")}
      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
        estadoFiltro === "custodia_vencida"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-slate-200 bg-white text-slate-600 hover:border-red-200"
      }`}
    >
      Custodia vencida
      <span className="font-bold">{stats.custodiaVencida}</span>
    </button>

    <button
      type="button"
      onClick={() => setEstadoFiltro("todos")}
      className="ml-auto text-sm font-semibold text-[#2563eb] transition hover:text-[#1e40af]"
    >
      Ver todos ({pedidos.length})
    </button>
  </div>
</section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
    <div className="flex items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-[#2563eb]">
        <Store size={21} />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Tus establecimientos
        </p>

        <h2 className="mt-1 text-xl font-bold text-[#1e3a8a]">
          Administra tu operación
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Selecciona el establecimiento que quieres revisar en el panel.
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={() => router.push("/establecimiento")}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-[#2563eb] transition hover:bg-blue-100"
    >
      <Plus size={17} />
      Agregar establecimiento
    </button>
  </div>

  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="min-w-0 flex-1">
        <label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
          Establecimiento actual
        </label>

        <select
          className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-blue-100"
          value={selectedEstId || ""}
          onChange={(e) => setSelectedEstId(e.target.value)}
        >
          {establecimientos.map((e) => (
            <option key={e.uuid} value={e.uuid}>
              {e.nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={() =>
          router.push(
  `/establecimiento?editar=${selectedEstablecimiento?.id}`
)
        }
        disabled={!selectedEstablecimiento}
        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#1e3a8a] transition hover:border-blue-200 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Settings size={17} />
        Editar
      </button>
    </div>

    {selectedEstablecimiento?.direccion && (
      <div className="mt-4 flex items-start gap-2 border-t border-slate-200 pt-4 text-sm text-slate-500">
        <MapPin
          size={16}
          className="mt-0.5 shrink-0 text-[#2563eb]"
        />
        <span>{selectedEstablecimiento.direccion}</span>
      </div>
    )}
  </div>
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
            {pedidosFiltrados.length === 0 && (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
    {estadoFiltro === "todos"
      ? "No hay pedidos registrados para este establecimiento."
      : "No hay pedidos en este estado."}
  </div>
)}

            {pedidosFiltrados.map((p) => (
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

function PipelineMetric({
  icon,
  label,
  value,
  onClick,
  active = false,
  first = false,
  last = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border p-5 text-left shadow-sm transition-all ${
        active
          ? "border-blue-300 bg-blue-50 shadow-md"
          : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-md"
      }`}
    >
      {!last && (
        <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-blue-100 bg-blue-50 px-1.5 text-sm font-bold text-[#2563eb] md:block">
          →
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            first
              ? "border-amber-100 bg-amber-50 text-amber-600"
              : last
                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
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
        {label}
      </p>
    </button>
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