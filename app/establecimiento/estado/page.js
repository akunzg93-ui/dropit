"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EstablecimientoEstadoPage() {
  const router = useRouter();

  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstId, setSelectedEstId] = useState(null);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [vendedorInfo, setVendedorInfo] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [pendientesGlobales, setPendientesGlobales] = useState([]);

  // 🔥 stats
  const [stats, setStats] = useState({
    total: 0,
    pendientes: 0,
    transito: 0,
    entregados: 0,
  });

  // -------------------------------
  // CARGAR ESTABLECIMIENTOS
  // -------------------------------
 useEffect(() => {

  const {
    data: listener,
  } = supabase.auth.onAuthStateChange(
    async (_event, session) => {

      const userId =
        session?.user?.id;

      console.log(
        "🔥 AUTH READY:",
        userId
      );

      if (!userId) return;

      console.log(
        "🚀 entrando query establecimientos"
      );

      const { data, error } =
        await supabase
          .from("establecimientos")
          .select("*")
          .eq("usuario_id", userId);

      console.log(
        "✅ query terminada"
      );

      console.log(
        "🟢 ESTABLECIMIENTOS:",
        data
      );

      console.log(
        "🔴 ERROR ESTABLECIMIENTOS:",
        error
      );

      if (error) {
        console.error(error);
        setLoadingInicial(false);
        return;
      }

      const establecimientosData =
        data || [];

      setEstablecimientos(
        establecimientosData
      );

      if (
        establecimientosData.length > 0
      ) {

        const firstId =
          establecimientosData[0].uuid;

        console.log(
          "🟣 FIRST ID:",
          firstId
        );

        setSelectedEstId((prev) => {
  if (prev) return prev;
  return firstId;
});

        // 🔥 fuerza carga inmediata
        const { data: pedidosData } =
          await supabase
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
            .eq(
              "establecimiento_uuid",
              firstId
            );

        const list =
          pedidosData || [];

        setPedidos(list);

        setStats({
          total: list.length,
          pendientes: list.filter(
            (p) =>
              p.estado ===
              "pendiente_aprobacion_establecimiento"
          ).length,
          transito: list.filter(
            (p) =>
              p.estado === "en_transito"
          ).length,
          entregados: list.filter(
            (p) =>
              p.estado === "entregado"
          ).length,
        });
      }

      setLoadingInicial(false);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };

}, []);

  // -------------------------------
  // CARGAR PEDIDOS
  // -------------------------------
  useEffect(() => {
    console.log("🟡 selectedEstId:", selectedEstId);
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

        console.log("📦 PEDIDOS:", data);

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

  // -------------------------------
  // PENDIENTES GLOBALES
  // -------------------------------
  useEffect(() => {
    const cargarPendientesGlobales = async () => {
      const {
  data: { session },
} = await supabase.auth.getSession();

const userId = session?.user?.id;
console.log("🔵 SESSION:", session);
console.log("🔵 USER ID:", userId);
      if (!userId) {

  return;
}

      const { data: ests } = await supabase
        .from("establecimientos")
        .select("uuid")
        .eq("usuario_id", userId);

      const uuids = ests?.map((e) => e.uuid) || [];

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

  // -------------------------------
  // FILTRO
  // -------------------------------
  const pendientes = pedidos.filter(
    (p) => p.estado === "pendiente_aprobacion_establecimiento"
  );

  // -------------------------------
  // BADGES
  // -------------------------------
  const getBadge = (estado) => {
    if (estado === "pendiente_aprobacion_establecimiento")
      return "bg-amber-100 text-amber-700";
    if (estado === "pendiente_recoleccion")
      return "bg-indigo-100 text-indigo-700";
    if (estado === "en_transito")
      return "bg-blue-100 text-blue-700";
    if (estado === "entregado")
      return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-600";
  };

 return (
  <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6 md:py-12 pb-36">
    <div className="max-w-6xl mx-auto space-y-5 md:space-y-8">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-[28px] p-5 md:p-8 shadow-xl">

        <div className="flex items-start justify-between gap-4">

          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Panel Multi-Local
            </h1>

            <p className="text-sm text-white/80 mt-1">
              Gestión de pedidos en tiempo real
            </p>
          </div>

          {pendientesGlobales.length > 0 && (
            <div
              onClick={() => {
                if (pendientes.length === 1) {
                  router.push(`/establecimiento/aprobar/${pendientes[0].id}`);
                } else {
                  router.push("/establecimiento/aprobaciones");
                }
              }}
              className="
                shrink-0
                flex
                items-center
                justify-center
                min-w-[54px]
                h-[54px]
                rounded-2xl
                bg-white/15
                backdrop-blur
                text-lg
                font-semibold
                cursor-pointer
                active:scale-95
                transition
              "
            >
              🔔 {pendientesGlobales.length}
            </div>
          )}

        </div>
      </div>

      {/* SELECT */}
      <div className="bg-white p-4 md:p-6 rounded-[28px] shadow border border-slate-200">

        <label className="text-sm font-medium text-gray-600">
          Establecimiento
        </label>

        <select
          className="
            w-full
            h-12
            px-4
            mt-2
            rounded-2xl
            border
            border-slate-200
            bg-white
            text-sm
            focus:ring-2
            focus:ring-indigo-500
          "
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

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-white p-4 rounded-[24px] shadow border border-slate-200">
          <p className="text-xs text-gray-500">
            Total
          </p>

          <p className="text-2xl font-bold mt-1">
            {stats.total}
          </p>
        </div>

        <div className="bg-amber-50 p-4 rounded-[24px] shadow-sm border border-amber-200">
          <p className="text-xs text-amber-700">
            Por aprobar
          </p>

          <p className="text-2xl font-bold text-amber-600 mt-1">
            {stats.pendientes}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-[24px] shadow-sm border border-blue-200">
          <p className="text-xs text-blue-700">
            En tránsito
          </p>

          <p className="text-2xl font-bold text-blue-600 mt-1">
            {stats.transito}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-[24px] shadow-sm border border-green-200">
          <p className="text-xs text-green-700">
            Entregados
          </p>

          <p className="text-2xl font-bold text-green-600 mt-1">
            {stats.entregados}
          </p>
        </div>

      </div>

      {/* PENDIENTES */}
      {pendientes.length > 0 && (
        <div className="bg-white p-4 md:p-6 rounded-[28px] shadow border border-slate-200">

          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base md:text-lg">
              Pendientes de aprobación
            </h2>

            <span className="text-xs text-slate-400">
              {pendientes.length} pendientes
            </span>
          </div>

          <div className="space-y-3">

            {pendientes.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  router.push(`/establecimiento/aprobar/${p.id}`)
                }
                className="
                  cursor-pointer
                  border
                  border-slate-200
                  p-4
                  rounded-2xl
                  flex
                  items-center
                  justify-between
                  gap-3
                  hover:bg-slate-50
                  active:scale-[0.99]
                  transition
                "
              >
                <div className="min-w-0">

                  <p className="font-semibold truncate">
                    {p.folio}
                  </p>

                  <span className="
                    inline-flex
                    mt-2
                    text-[11px]
                    px-2.5
                    py-1
                    rounded-full
                    bg-amber-100
                    text-amber-700
                  ">
                    Esperando aprobación
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/establecimiento/aprobar/${p.id}`);
                  }}
                  className="
                    shrink-0
                    text-xs
                    bg-indigo-600
                    text-white
                    px-4
                    py-2
                    rounded-xl
                  "
                >
                  Revisar
                </button>
              </div>
            ))}

          </div>
        </div>
      )}

      {/* PEDIDOS */}
      <div className="bg-white p-4 md:p-6 rounded-[28px] shadow border border-slate-200">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-base md:text-lg">
            Todos los pedidos
          </h2>

          <span className="text-xs text-slate-400">
            {pedidos.length} registros
          </span>
        </div>

        <div className="space-y-3">

          {pedidos.map((p) => (
            <div
              key={p.id}
              className="
                border
                border-slate-200
                rounded-2xl
                p-4
                flex
                items-center
                justify-between
                gap-4
              "
            >
              <div className="min-w-0">

                <p className="font-semibold truncate">
                  {p.folio}
                </p>

                <div className="flex items-center gap-2 mt-2 flex-wrap">

                  <span
                    className={`
                      px-3
                      py-1
                      rounded-full
                      text-[11px]
                      whitespace-nowrap
                      ${getBadge(p.estado)}
                    `}
                  >
                    {p.estado.replaceAll("_", " ")}
                  </span>

                  <span className="text-[11px] text-slate-400">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>

            </div>
          ))}

        </div>
      </div>

    </div>
  </div>
);
}