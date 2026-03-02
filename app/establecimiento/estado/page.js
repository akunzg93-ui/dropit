"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const ESTADOS_ACTIVOS = [
  "PENDING_VENDOR",
  "IN_TRANSIT_TO_ESTABLISHMENT",
  "AT_ESTABLISHMENT",
  "READY_FOR_PICKUP",
];

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
                active ? "bg-indigo-600" : "bg-slate-300"
              }`}
            />
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-[2px] ${
                  active ? "bg-indigo-600" : "bg-slate-300"
                }`}
              />
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
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  useEffect(() => {
    const cargarEstablecimientos = async () => {
      const { data } = await supabase
        .from("establecimientos")
        .select("*");

      setEstablecimientos(data || []);
      if (data?.length > 0) setSelectedEstId(data[0].id);
    };

    cargarEstablecimientos();
  }, []);

  useEffect(() => {
    if (!selectedEstId) return;

    const cargarDeliveries = async () => {
      const { data } = await supabase
        .from("deliveries")
        .select("*")
        .eq("establishment_id", selectedEstId);

      setDeliveries(data || []);
      setUltimaActualizacion(new Date());
    };

    cargarDeliveries();
    const interval = setInterval(cargarDeliveries, 15000);
    return () => clearInterval(interval);
  }, [selectedEstId]);

  useEffect(() => {
    let lista = [...deliveries];

    if (search.trim()) {
      const s = search.toLowerCase();
      lista = lista.filter(
        (d) =>
          d.id.toString().includes(s) ||
          (d.buyer_id || "").toLowerCase().includes(s) ||
          (d.vendor_id || "").toLowerCase().includes(s)
      );
    }

    setFiltered(lista);
  }, [deliveries, search]);

  // -------------------------
  // MÉTRICAS GLOBALES
  // -------------------------

  const totalLocales = establecimientos.length;

  const totalCapacidad = establecimientos.reduce(
    (acc, e) =>
      acc +
      (e.capacidad_small || 0) +
      (e.capacidad_medium || 0),
    0
  );

  const totalActivos = deliveries.filter((d) =>
    ESTADOS_ACTIVOS.includes(d.status)
  ).length;

  const ingresosTotales = deliveries.reduce(
    (acc, d) => acc + (d.amount || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold">
            Panel Multi-Local
          </h1>
          <p className="text-white/90 text-sm mt-1">
            Vista consolidada de operación
          </p>
        </div>

        {/* KPI GLOBAL */}
        <div className="grid sm:grid-cols-4 gap-6">

          <div className="bg-white rounded-3xl p-6 shadow border">
            <p className="text-sm text-slate-500">Locales activos</p>
            <p className="text-3xl font-bold text-indigo-700">
              {totalLocales}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <p className="text-sm text-slate-500">Capacidad total</p>
            <p className="text-3xl font-bold">
              {totalCapacidad}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <p className="text-sm text-slate-500">Paquetes activos</p>
            <p className="text-3xl font-bold text-amber-600">
              {totalActivos}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border">
            <p className="text-sm text-slate-500">Ingresos totales</p>
            <p className="text-3xl font-bold text-emerald-600">
              ${ingresosTotales}
            </p>
          </div>
        </div>

        {/* TABLA LOCALES */}
        <div className="bg-white rounded-3xl shadow-lg border p-6">
          <h2 className="font-semibold mb-6 text-slate-800">
            Rendimiento por local
          </h2>

          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Local</th>
                <th className="px-4 py-3 text-center">Capacidad</th>
                <th className="px-4 py-3 text-center">Ocupación</th>
              </tr>
            </thead>

            <tbody>
              {establecimientos.map((est) => {
                const total =
                  (est.capacidad_small || 0) +
                  (est.capacidad_medium || 0);

                const ocupacion =
                  total > 0
                    ? Math.min(
                        100,
                        Math.round((totalActivos / total) * 100)
                      )
                    : 0;

                let colorBar = "bg-emerald-500";
                let badge = null;

                if (ocupacion > 80) {
                  colorBar = "bg-red-500";
                  badge = "Saturado";
                } else if (ocupacion > 60) {
                  colorBar = "bg-amber-500";
                  badge = "Alta demanda";
                }

                return (
                  <tr key={est.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-medium">
                        {est.nombre}
                      </div>
                      <div className="text-xs text-slate-500">
                        {est.direccion}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {total}
                    </td>

                    <td className="px-4 py-4">
                      <div className="w-full bg-slate-200 h-2 rounded-full">
                        <div
                          className={`${colorBar} h-2 rounded-full transition-all`}
                          style={{ width: `${ocupacion}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span>{ocupacion}%</span>
                        {badge && (
                          <span className={`px-2 py-1 rounded-full text-white text-[10px] ${
                            ocupacion > 80
                              ? "bg-red-500"
                              : "bg-amber-500"
                          }`}>
                            {badge}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DELIVERIES */}
        <div className="bg-white rounded-3xl shadow-lg border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-semibold text-slate-800">
              Entregas recientes
            </h2>
            <div className="text-xs text-slate-500">
              Actualizado: {ultimaActualizacion?.toLocaleTimeString() || "—"}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Buyer</th>
                <th className="px-3 py-2">Vendedor</th>
                <th className="px-3 py-2">Timeline</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-500">
                    No se encontraron entregas.
                  </td>
                </tr>
              )}

              {filtered.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-3 py-2">{d.id}</td>
                  <td className="px-3 py-2 text-xs">
                    {d.buyer_id || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {d.vendor_id || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Timeline status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}