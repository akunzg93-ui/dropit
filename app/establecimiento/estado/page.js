// app/establecimiento/estado/page.jsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// Estados considerados “activos” en capacidad
const ESTADOS_ACTIVOS = [
  "PENDING_VENDOR",
  "IN_TRANSIT_TO_ESTABLISHMENT",
  "AT_ESTABLISHMENT",
  "READY_FOR_PICKUP",
];

const ALL_STATES = [
  "TODOS",
  "PENDING_VENDOR",
  "IN_TRANSIT_TO_ESTABLISHMENT",
  "AT_ESTABLISHMENT",
  "READY_FOR_PICKUP",
  "DELIVERED_TO_BUYER",
];

// ----------------------------------------------------
// TIMELINE COMPONENT (visual flow)
// ----------------------------------------------------
function Timeline({ status }) {
  const steps = [
    "PENDING_VENDOR",
    "IN_TRANSIT_TO_ESTABLISHMENT",
    "AT_ESTABLISHMENT",
    "READY_FOR_PICKUP",
    "DELIVERED_TO_BUYER",
  ];

  return (
    <div className="flex items-center gap-2 text-xs">
      {steps.map((step, i) => {
        const active = steps.indexOf(status) >= i;
        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                active ? "bg-blue-600" : "bg-gray-300"
              }`}
            ></div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-0.5 ${
                  active ? "bg-blue-600" : "bg-gray-300"
                }`}
              ></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EstablecimientoEstadoPage() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstId, setSelectedEstId] = useState(null);

  const [deliveries, setDeliveries] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("TODOS");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // ---------------------------------------------------
  // 1) Cargar establecimientos
  // ---------------------------------------------------
  useEffect(() => {
    const cargarEstablecimientos = async () => {
      const { data, error } = await supabase
        .from("establecimientos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) return setMensaje("Error al cargar establecimientos.");
      setEstablecimientos(data || []);

      if (data?.length > 0 && !selectedEstId) {
        setSelectedEstId(data[0].id);
      }
    };

    cargarEstablecimientos();
  }, []);

  // ---------------------------------------------------
  // 2) Cargar deliveries del establecimiento
  // ---------------------------------------------------
  useEffect(() => {
    if (!selectedEstId) return;

    const cargarDeliveries = async () => {
      setCargando(true);

      const { data, error } = await supabase
        .from("deliveries")
        .select("*")
        .eq("establishment_id", selectedEstId)
        .order("created_at", { ascending: false });

      setCargando(false);

      if (error) return setMensaje("Error al cargar entregas.");

      setDeliveries(data || []);
      setUltimaActualizacion(new Date());
    };

    cargarDeliveries();

    // ⏱ REFRESH cada 15 segundos
    const interval = setInterval(cargarDeliveries, 15000);
    return () => clearInterval(interval);

  }, [selectedEstId]);

  // ---------------------------------------------------
  // 3) Filtros combinados
  // ---------------------------------------------------
  useEffect(() => {
    let lista = [...deliveries];

    // FILTRO POR ESTADO
    if (filterEstado !== "TODOS") {
      lista = lista.filter((d) => d.status === filterEstado);
    }

    // FILTRO POR BUSQUEDA
    if (search.trim() !== "") {
      const s = search.toLowerCase();
      lista = lista.filter(
        (d) =>
          d.id.toString().includes(s) ||
          (d.buyer_id || "").toLowerCase().includes(s) ||
          (d.vendor_id || "").toLowerCase().includes(s)
      );
    }

    setFiltered(lista);
  }, [deliveries, search, filterEstado]);

  // ---------------------------------------------------
  // Helpers capacidad
  // ---------------------------------------------------
  const actual = establecimientos.find((e) => e.id === selectedEstId);
  const capSmall = actual?.capacidad_small || 0;
  const capMedium = actual?.capacidad_medium || 0;

  const activos = deliveries.filter((d) =>
    ESTADOS_ACTIVOS.includes(d.status)
  );

  const capacidadRestante = capSmall + capMedium - activos.length;

  const paquetesEnCamino = deliveries.filter(
    (d) => d.status === "IN_TRANSIT_TO_ESTABLISHMENT"
  ).length;

  const hoy = new Date().toISOString().split("T")[0];
  const paquetesRecibidosHoy = deliveries.filter((d) => {
    const fecha = d.created_at?.split("T")[0];
    return fecha === hoy && d.status === "AT_ESTABLISHMENT";
  }).length;

  // ---------------------------------------------------
  // Acciones
  // ---------------------------------------------------
  const actualizarEstado = async (id, nuevo) => {
    const { data, error } = await supabase
      .from("deliveries")
      .update({ status: nuevo })
      .eq("id", id)
      .select()
      .single();

    if (error) return setMensaje("Error al actualizar estado.");

    setDeliveries((prev) =>
      prev.map((d) => (d.id === id ? data : d))
    );
    setUltimaActualizacion(new Date());
  };

  const marcarRecibido = (id) =>
    actualizarEstado(id, "AT_ESTABLISHMENT");

  const marcarEntregado = (id) =>
    actualizarEstado(id, "DELIVERED_TO_BUYER");

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">

      {/* HEADER SKDROPX */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl p-6 shadow-md">
        <h1 className="text-xl font-semibold">Panel de Operación del Establecimiento</h1>
        <p className="text-sm text-blue-100 mt-1">
          Control de paquetes, capacidad y operaciones
        </p>
      </div>

      {/* ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          🚚 <p className="text-sm text-gray-600">Paquetes en camino</p>
          <p className="text-2xl font-bold">{paquetesEnCamino}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          📦 <p className="text-sm text-gray-600">Recibidos hoy</p>
          <p className="text-2xl font-bold">{paquetesRecibidosHoy}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          🔔 <p className="text-sm text-gray-600">Capacidad restante</p>
          <p className="text-2xl font-bold">{capacidadRestante}</p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          ⏳ <p className="text-sm text-gray-600">Última actualización</p>
          <p className="text-xs mt-1">
            {ultimaActualizacion?.toLocaleTimeString() || "—"}
          </p>
        </div>
      </div>

      {/* SELECT ESTABLECIMIENTO */}
      <div className="bg-white p-4 rounded-xl border shadow-sm">
        <label className="text-sm font-medium">Seleccionar establecimiento</label>
        <select
          className="border rounded px-3 py-2 text-sm w-full sm:w-80 mt-2"
          value={selectedEstId || ""}
          onChange={(e) => setSelectedEstId(Number(e.target.value))}
        >
          {establecimientos.map((est) => (
            <option key={est.id} value={est.id}>
              {est.nombre} – {est.direccion}
            </option>
          ))}
        </select>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Buscar por ID / buyer / vendedor..."
          className="border px-3 py-2 rounded w-full sm:w-80 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border px-3 py-2 rounded text-sm"
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          {ALL_STATES.map((st) => (
            <option key={st}>{st.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow p-4 border">
        <table className="min-w-full text-sm border-separate border-spacing-y-1">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Buyer</th>
              <th className="px-3 py-2">Vendedor</th>
              <th className="px-3 py-2">Timeline</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-500">
                  No se encontraron entregas.
                </td>
              </tr>
            )}

            {filtered.map((d) => (
              <tr key={d.id} className="bg-white shadow-sm">
                <td className="px-3 py-2">{d.id}</td>
                <td className="px-3 py-2 text-xs">{d.buyer_id || "—"}</td>
                <td className="px-3 py-2 text-xs">{d.vendor_id || "—"}</td>

                <td className="px-3 py-2">
                  <Timeline status={d.status} />
                </td>

                <td className="px-3 py-2 space-x-2">
                  {d.status === "PENDING_VENDOR" && (
                    <button
                      onClick={() => marcarRecibido(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700"
                    >
                      Recibido
                    </button>
                  )}

                  {d.status === "AT_ESTABLISHMENT" && (
                    <button
                      onClick={() => marcarEntregado(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs hover:bg-green-700"
                    >
                      Entregado
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mensaje && <p className="text-sm mt-2">{mensaje}</p>}
    </div>
  );
}
