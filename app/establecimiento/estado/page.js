"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EstablecimientoEstadoPage() {
  const router = useRouter();

  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstId, setSelectedEstId] = useState(null);
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
    const cargar = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

      const { data } = await supabase
        .from("establecimientos")
        .select("*")
        .eq("usuario_id", userId);

      setEstablecimientos(data || []);
      if (data?.length) setSelectedEstId(data[0].uuid);
    };

    cargar();
  }, []);

  // -------------------------------
  // CARGAR PEDIDOS
  // -------------------------------
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

  // -------------------------------
  // PENDIENTES GLOBALES
  // -------------------------------
  useEffect(() => {
    const cargarPendientesGlobales = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;

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
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Panel Multi-Local</h1>
            <p className="text-sm opacity-90">
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
              className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/20 transition"
            >
              🔔 {pendientesGlobales.length}
            </div>
          )}
        </div>

        {/* SELECT */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <label className="text-sm font-medium text-gray-600">
            Establecimiento
          </label>
          <select
            className="w-full h-11 px-4 mt-2 rounded-xl border focus:ring-2 focus:ring-indigo-500"
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
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow border">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow border">
            <p className="text-sm text-gray-500">Por aprobar</p>
            <p className="text-2xl font-bold text-amber-600">
              {stats.pendientes}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow border">
            <p className="text-sm text-gray-500">En tránsito</p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.transito}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow border">
            <p className="text-sm text-gray-500">Entregados</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.entregados}
            </p>
          </div>
        </div>

        {/* PENDIENTES */}
        {pendientes.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow border">
            <h2 className="font-semibold mb-4 text-lg">
              Pendientes de aprobación
            </h2>

            {pendientes.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  router.push(`/establecimiento/aprobar/${p.id}`)
                }
                className="cursor-pointer border p-4 rounded-xl mb-3 flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium">{p.folio}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    Esperando aprobación
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/establecimiento/aprobar/${p.id}`);
                  }}
                  className="text-xs bg-indigo-600 text-white px-4 py-1 rounded-lg"
                >
                  Revisar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TABLA */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <h2 className="font-semibold mb-4 text-lg">
            Todos los pedidos
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="py-3">Folio</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 font-medium">{p.folio}</td>

                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs ${getBadge(p.estado)}`}>
                        {p.estado.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="text-gray-500 text-xs">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}