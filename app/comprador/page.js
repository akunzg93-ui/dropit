"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const MapaEstablecimientos = dynamic(
  () => import("../components/MapaEstablecimientos"),
  { ssr: false }
);

function calcularDistanciaKm(p1, p2) {
  if (!p1 || !p2) return null;

  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function CompradorPage() {
  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const router = useRouter();

  useEffect(() => {
    const pid = sessionStorage.getItem("pedido_id");
    if (pid) setPedidoId(Number(pid));
  }, []);

  useEffect(() => {
    if (!pedidoId) return;

    supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single()
      .then(({ data }) => setPedido(data));
  }, [pedidoId]);

  useEffect(() => {
    if (!pedidoId) return;

    supabase
      .from("pedido_establecimientos")
      .select(`
        establecimientos (
          id,
          nombre,
          direccion,
          lat,
          lng,
          horario
        )
      `)
      .eq("pedido_id", pedidoId)
      .then(({ data }) => {
        const ests = (data || [])
          .map((r) => r.establecimientos)
          .filter(Boolean);

        setEstablecimientos(ests);
      });
  }, [pedidoId]);

  const listaOrdenada = establecimientos
    .map((e) => ({
      ...e,
      distancia: ubicacion
        ? calcularDistanciaKm(ubicacion, { lat: e.lat, lng: e.lng })
        : null,
    }))
    .sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999));

  async function confirmarSeleccion() {
    if (!pedidoId || !seleccion) return;

    const res = await fetch("/api/orders/confirmado", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pedido_id: pedidoId,
        establecimiento_id: seleccion,
      }),
    });

    if (!res.ok) {
      setMensaje("❌ Error al confirmar el pedido");
      return;
    }

    router.push(`/track/${pedido.folio}?confirmed=1`);
  }

  if (!pedidoId) {
    return (
      <p className="text-center mt-10 text-slate-500">
        No hay pedido validado
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER PREMIUM + PROGRESO */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-lg space-y-4">
          
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Paso 2 de 3</span>
            <span>Selección de entrega</span>
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-white rounded-full transition-all"></div>
          </div>

          <h1 className="text-3xl font-bold">
            Selecciona tu punto de entrega
          </h1>

          {pedido && (
            <p className="text-white/90">
              Pedido <strong>{pedido.folio}</strong> — {pedido.producto}
            </p>
          )}
        </div>

        {/* MAPA */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200">
          <div className="h-96">
            <MapaEstablecimientos
              establecimientos={establecimientos}
              selectedPoint={ubicacion}
              onLocationSelected={setUbicacion}
            />
          </div>
        </div>

        {/* CONTADOR SELECCIÓN */}
        {seleccion && (
          <div className="text-sm text-indigo-600 font-semibold">
            1 punto seleccionado
          </div>
        )}

        {/* LISTA */}
        <div className="grid gap-5">
          {listaOrdenada.map((e, index) => {
            const esMasCercano = index === 0 && e.distancia;

            return (
              <div
                key={e.id}
                onClick={() => setSeleccion(e.id)}
                className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 border transform ${
                  seleccion === e.id
                    ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500 shadow-lg scale-[1.01]"
                    : "bg-white border-slate-200 hover:bg-slate-50 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      {e.nombre}
                    </h3>

                    <p className="text-sm text-slate-600 mt-1">
                      {e.direccion}
                    </p>

                    <p className="text-xs text-slate-500 mt-2">
                      Horario: {e.horario || "Horario no especificado"}
                    </p>

                    {e.distancia && (
                      <p className="text-xs text-slate-500 mt-2">
                        {e.distancia.toFixed(2)} km de distancia
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    {esMasCercano && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                        Más cercano
                      </span>
                    )}

                    {seleccion === e.id && (
                      <span className="text-xs bg-indigo-600 text-white px-2 py-1 rounded-full font-medium">
                        Seleccionado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTÓN */}
        <Button
          disabled={!seleccion}
          onClick={confirmarSeleccion}
          className={`w-full py-6 text-lg rounded-2xl transition-all duration-300 ${
            seleccion
              ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:scale-[1.02] shadow-xl"
              : "bg-slate-300 cursor-not-allowed"
          }`}
        >
          Confirmar punto de entrega
        </Button>

        {mensaje && (
          <p className="text-center text-red-600 mt-4 font-medium">
            {mensaje}
          </p>
        )}
      </div>
    </div>
  );
}