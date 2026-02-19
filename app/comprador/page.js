"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


// --------------------
// Mapa sin SSR
// --------------------
const MapaEstablecimientos = dynamic(
  () => import("../components/MapaEstablecimientos"),
  { ssr: false }
);

// --------------------
// Haversine
// --------------------
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
  const [buyerId, setBuyerId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const router = useRouter();


  // --------------------
  // Usuario + pedido
  // --------------------
  useEffect(() => {
    supabase.auth.getUser().then((r) => {
      setBuyerId(r.data.user?.id || null);
    });

    const pid = sessionStorage.getItem("pedido_id");
    if (pid) setPedidoId(Number(pid));
  }, []);

  // --------------------
  // Pedido
  // --------------------
  useEffect(() => {
    if (!pedidoId) return;

    supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single()
      .then(({ data }) => setPedido(data));
  }, [pedidoId]);

  // --------------------
  // Establecimientos permitidos (YA FUNCIONA, NO TOCAR)
  // --------------------
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
      .then(({ data, error }) => {
        if (error) {
          console.error("Error cargando establecimientos:", error);
          return;
        }

        const ests = (data || [])
          .map((r) => r.establecimientos)
          .filter(Boolean);

        setEstablecimientos(ests);
      });
  }, [pedidoId]);

  // --------------------
  // Ordenar por distancia
  // --------------------
  const listaOrdenada = establecimientos
    .map((e) => ({
      ...e,
      distancia: ubicacion
        ? calcularDistanciaKm(ubicacion, { lat: e.lat, lng: e.lng })
        : null,
    }))
    .sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999));

  // --------------------
  // Confirmar selección
  // --------------------
  async function confirmarSeleccion() {
    if (!buyerId || !pedidoId || !seleccion) return;

    try {
      const res = await fetch("/api/orders/confirmado", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    pedido_id: pedidoId,
    establecimiento_id: seleccion, // 👈 ESTE ERA EL FALTANTE
  }),
});
      const data = await res.json();

      // 🔎 DEBUG TEMPORAL
      console.log("DEBUG status:", res.status);
      console.log("DEBUG response:", data);
      console.log("DEBUG pedido_id:", pedidoId);
      console.log("DEBUG seleccion:", seleccion);

      if (!res.ok) {
        console.error("Error API:", data);
        setMensaje("❌ Error al confirmar el pedido");
        return;
      }

      router.push(`/track/${pedido.folio}?confirmed=1`);


    } catch (err) {
      console.error("Error confirmando pedido:", err);
      setMensaje("❌ Error al confirmar el pedido");
    }
  }

  // --------------------
  // UI
  // --------------------
  if (!pedidoId) {
    return (
      <p className="text-center mt-10 text-gray-500">
        No hay pedido validado
      </p>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <p className="text-sm text-blue-600 font-medium">
          Paso 2 de 3 · Selección de entrega
        </p>
        <h1 className="text-3xl font-bold">
          Selecciona tu punto de entrega
        </h1>
        {pedido && (
          <p className="text-gray-600">
            Pedido <strong>{pedido.folio}</strong> — {pedido.producto}
          </p>
        )}
      </div>

      <div className="h-96 rounded-xl shadow overflow-hidden">
        <MapaEstablecimientos
          establecimientos={establecimientos}
          selectedPoint={ubicacion}
          onLocationSelected={setUbicacion}
        />
      </div>

      <div className="grid gap-4">
        {listaOrdenada.map((e) => (
          <div
            key={e.id}
            onClick={() => setSeleccion(e.id)}
            className={`border rounded-xl p-5 cursor-pointer transition ${
              seleccion === e.id
                ? "border-blue-600 bg-blue-50"
                : "hover:border-gray-400"
            }`}
          >
            <h3 className="font-semibold text-lg">{e.nombre}</h3>
            <p className="text-sm text-gray-600">{e.direccion}</p>
            <p className="text-xs text-gray-500 mt-1">
              Horario: {e.horario || "Horario no especificado"}
            </p>
          </div>
        ))}
      </div>

      <Button
        disabled={!seleccion}
        onClick={confirmarSeleccion}
        className="w-full py-6 text-lg"
      >
        Confirmar punto de entrega
      </Button>

      {mensaje && (
        <p className="text-center text-green-600 mt-2">
          {mensaje}
        </p>
      )}
    </div>
  );
}
