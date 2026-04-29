"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function EstablecimientoEstadoPage() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [selectedEstId, setSelectedEstId] = useState(null);
  const [vendedorInfo, setVendedorInfo] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedido, setSelectedPedido] = useState(null);

  // 🔥 GLOBAL
  const [pendientesGlobales, setPendientesGlobales] = useState([]);

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

      if (data && data.length > 0) {
        setSelectedEstId(data[0].uuid);
      }
    };

    cargar();
  }, []);

  // -------------------------------
  // CARGAR PEDIDOS (LOCAL)
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
          establecimiento_uuid
        `)
        .eq("establecimiento_uuid", selectedEstId);

      setPedidos(data || []);
    };

    cargarPedidos();
  }, [selectedEstId]);

  // -------------------------------
  // 🔥 CARGAR PENDIENTES GLOBALES
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

      if (uuids.length === 0) return;

      const { data: pedidosGlobal } = await supabase
        .from("pedidos")
        .select("id, establecimiento_uuid")
        .in("establecimiento_uuid", uuids)
        .eq("estado", "pendiente_aprobacion_establecimiento");

      setPendientesGlobales(pedidosGlobal || []);
    };

    cargarPendientesGlobales();

    // 🔥 refresco cada 15s (como Uber)
    const interval = setInterval(cargarPendientesGlobales, 15000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------
  // FILTRO LOCAL
  // -------------------------------
  const pendientes = pedidos.filter(
    (p) => p.estado === "pendiente_aprobacion_establecimiento"
  );

  // -------------------------------
  // ACCIONES
  // -------------------------------
  async function handleAceptar(id) {
    await fetch("/api/orders/aceptar-establecimiento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pedido_id: id }),
    });

    setPedidos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, estado: "en_transito" } : p
      )
    );

    // 🔥 refrescar global
    setPendientesGlobales((prev) =>
      prev.filter((p) => p.id !== id)
    );

    setSelectedPedido(null);
    setVendedorInfo(null);
  }

  async function handleRechazar(id) {
    await fetch("/api/orders/rechazar-establecimiento", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pedido_id: id }),
    });

    setPedidos((prev) => prev.filter((p) => p.id !== id));

    // 🔥 refrescar global
    setPendientesGlobales((prev) =>
      prev.filter((p) => p.id !== id)
    );

    setSelectedPedido(null);
    setVendedorInfo(null);
  }

  // -------------------------------
  // SOCIAL META
  // -------------------------------
  function getSocialMeta(url) {
    if (!url) return null;
    const clean = url.replace(/^https?:\/\//, "").toLowerCase();

    if (clean.includes("facebook")) return { name: "Facebook", icon: "📘" };
    if (clean.includes("instagram")) return { name: "Instagram", icon: "📸" };
    if (clean.includes("tiktok")) return { name: "TikTok", icon: "🎵" };
    if (clean.includes("twitter") || clean.includes("x.com"))
      return { name: "X", icon: "🐦" };

    return { name: "Red social", icon: "🔗" };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Panel Multi-Local</h1>
            <p className="text-sm opacity-90">
              Gestión de pedidos en tiempo real
            </p>
          </div>

          {/* 🔥 CAMPANA GLOBAL */}
          {pendientesGlobales.length > 0 && (
            <div
              onClick={() => {
                const first = pendientesGlobales[0];
                if (first) {
                  setSelectedEstId(first.establecimiento_uuid);
                }
              }}
              className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl cursor-pointer hover:bg-white/20 transition"
            >
              <div className="relative">
                <span className="text-lg">🔔</span>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                  {pendientesGlobales.length}
                </span>
              </div>
              <span className="text-xs">Pendientes</span>
            </div>
          )}
        </div>

        {/* SELECT */}
        <div className="bg-white p-5 rounded-2xl shadow border">
          <label className="text-xs text-gray-500">
            Selecciona establecimiento
          </label>
          <select
            className="w-full mt-2 p-3 border rounded-xl"
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

        {/* PENDIENTES */}
        {pendientes.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow border">
            <h2 className="font-semibold mb-4">
              Pendientes de aprobación
            </h2>

            {pendientes.map((p) => (
              <div
                key={p.id}
                className="border p-4 rounded-xl mb-3 flex justify-between items-center cursor-pointer"
                onClick={async () => {
                  setSelectedPedido(p);

                  const { data } = await supabase
                    .from("profiles")
                    .select("social_url")
                    .eq("id", p.vendedor_id)
                    .maybeSingle();

                  setVendedorInfo(data);
                }}
              >
                <div>
                  <p>{p.folio}</p>
                  <span className="text-xs bg-amber-100 px-2 rounded">
                    Esperando aprobación
                  </span>
                </div>

                <button className="text-xs bg-indigo-600 text-white px-3 py-1 rounded">
                  Revisar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* TODOS */}
        <div className="bg-white p-6 rounded-2xl shadow border">
          <h2 className="font-semibold mb-4">
            Todos los pedidos
          </h2>

          {pedidos.map((p) => (
            <div key={p.id} className="border p-3 rounded mb-2 flex justify-between">
              <span>{p.folio}</span>
              <span className="text-xs">{p.estado}</span>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {selectedPedido && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-[350px] space-y-4">

              <h2>{selectedPedido.folio}</h2>

              <p>{selectedPedido.email_vendedor}</p>

              {vendedorInfo?.social_url && (() => {
                const meta = getSocialMeta(vendedorInfo.social_url);

                const fullUrl = vendedorInfo.social_url.startsWith("http")
                  ? vendedorInfo.social_url
                  : `https://${vendedorInfo.social_url}`;

                const clean = vendedorInfo.social_url.replace(/^https?:\/\//, "");

                return (
                  <a
                    href={fullUrl}
                    target="_blank"
                    className="text-indigo-600 underline flex gap-2"
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.name}</span>
                    <span className="text-xs text-gray-400">({clean})</span>
                  </a>
                );
              })()}

              <div className="flex gap-2">
                <button
                  onClick={() => handleAceptar(selectedPedido.id)}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded"
                >
                  Aceptar
                </button>

                <button
                  onClick={() => handleRechazar(selectedPedido.id)}
                  className="flex-1 bg-red-500 text-white py-2 rounded"
                >
                  Rechazar
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedPedido(null);
                  setVendedorInfo(null);
                }}
                className="text-xs text-gray-400 w-full"
              >
                Cancelar
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}