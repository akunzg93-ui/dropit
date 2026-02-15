"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Estados disponibles
const ESTADOS = [
  "TODOS",
  "PENDING_VENDOR",
  "IN_TRANSIT_TO_ESTABLISHMENT",
  "AT_ESTABLISHMENT",
  "READY_FOR_PICKUP",
  "DELIVERED_TO_BUYER",
];

// -------------------------------------------------------
// TIMELINE COMPONENT (Uber style)
// -------------------------------------------------------
function Timeline({ status }) {
  const pasos = [
    "PENDING_VENDOR",
    "IN_TRANSIT_TO_ESTABLISHMENT",
    "AT_ESTABLISHMENT",
    "READY_FOR_PICKUP",
    "DELIVERED_TO_BUYER",
  ];

  return (
    <div className="flex items-center gap-2 text-xs">
      {pasos.map((p, i) => {
        const activo = pasos.indexOf(status) >= i;
        return (
          <div key={p} className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                activo ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>

            {i < pasos.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  activo ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------

export default function VendedorEstadoPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");

  const [stats, setStats] = useState({
    creados: 0,
    entregadosEstablecimiento: 0,
    entregadosComprador: 0,
  });

  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  const [userId, setUserId] = useState(null);

  // Obtener usuario actual
  useEffect(() => {
    const user = supabase.auth.getUser();
    user.then((r) => setUserId(r.data.user?.id || null));
  }, []);

  // ------------------------------------------
  // Cargar deliveries del vendedor
  // ------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const cargar = async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("vendor_id", userId)
        .order("created_at", { ascending: false });

      if (error) return console.error(error);

      setDeliveries(data || []);
      setUltimaActualizacion(new Date());

      // stats
      const creados = data.length;
      const entregadosEstablecimiento = data.filter(
        (d) => d.status === "AT_ESTABLISHMENT"
      ).length;

      const entregadosComprador = data.filter(
        (d) => d.status === "DELIVERED_TO_BUYER"
      ).length;

      setStats({
        creados,
        entregadosEstablecimiento,
        entregadosComprador,
      });
    };

    cargar();

    // Auto-refresh cada 15s
    const interval = setInterval(cargar, 15000);
    return () => clearInterval(interval);

  }, [userId]);

  // ------------------------------------------
  // Filtro combinado
  // ------------------------------------------
  useEffect(() => {
    let lista = [...deliveries];

    if (filterEstado !== "TODOS") {
      lista = lista.filter((d) => d.status === filterEstado);
    }

    if (busqueda.trim() !== "") {
      const s = busqueda.toLowerCase();

      lista = lista.filter(
        (d) =>
          d.id.toString().includes(s) ||
          (d.buyer_id || "").toLowerCase().includes(s) ||
          (d.establishment_id || "").toString().includes(s)
      );
    }

    setFiltered(lista);
  }, [deliveries, filterEstado, busqueda]);

  // ------------------------------------------
  // Render
  // ------------------------------------------

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">

      {/* Header Skydropx */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 shadow">
        <h1 className="text-xl font-semibold">Vendedor – Historial de entregas</h1>
        <p className="text-sm text-blue-100 mt-1">
          Consulta tus entregas creadas, su estado y progreso en tiempo real.
        </p>
      </div>

      {/* Estadísticas del vendedor */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">

        <div className="rounded-xl border bg-white p-4 shadow">
          <p className="text-sm text-gray-600">🚚 Entregas creadas</p>
          <p className="text-2xl font-bold">{stats.creados}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow">
          <p className="text-sm text-gray-600">📦 Entregadas al establecimiento</p>
          <p className="text-2xl font-bold">
            {stats.entregadosEstablecimiento}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow">
          <p className="text-sm text-gray-600">🛒 Entregadas al comprador</p>
          <p className="text-2xl font-bold">
            {stats.entregadosComprador}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow">
          <p className="text-sm text-gray-600">⏳ Última actualización</p>
          <p className="text-xs mt-1">
            {ultimaActualizacion?.toLocaleTimeString() || "—"}
          </p>
        </div>

      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border shadow flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Buscar por ID / buyer / establecimiento..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border px-3 py-2 rounded text-sm w-full sm:w-80"
        />

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="border px-3 py-2 rounded text-sm"
        >
          {ESTADOS.map((s) => (
            <option key={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow p-4 border">
        <table className="min-w-full text-sm border-separate border-spacing-y-1">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Establecimiento</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Timeline</th>
              <th className="px-3 py-2 text-left">Fecha</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No hay entregas en tu historial.
                </td>
              </tr>
            )}

            {filtered.map((d) => (
              <tr key={d.id} className="bg-white shadow rounded-lg hover:bg-gray-50">
                <td className="px-3 py-2">{d.id}</td>
                <td className="px-3 py-2">{d.establishment_id}</td>

                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                      d.status === "AT_ESTABLISHMENT"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : d.status === "DELIVERED_TO_BUYER"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : d.status === "PENDING_VENDOR"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-300"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {d.status.replace(/_/g, " ")}
                  </span>
                </td>

                <td className="px-3 py-2">
                  <Timeline status={d.status} />
                </td>

                <td className="px-3 py-2 text-xs text-gray-500">
                  {new Date(d.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
