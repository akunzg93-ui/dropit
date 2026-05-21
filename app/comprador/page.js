"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import StarsPromedio from "@/app/components/StarsPromedio";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

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

  const [zonaFiltro, setZonaFiltro] =
    useState("todas");

  const router = useRouter();

  const establecimientosFiltrados =
    zonaFiltro === "todas"
      ? establecimientos
      : establecimientos.filter(
          (e) => e.zona === zonaFiltro
        );

  useEffect(() => {
    const pid = sessionStorage.getItem("pedido_id");

    if (pid) setPedidoId(Number(pid));
  }, []);

  // 🔥 PEDIDO + VENDEDOR + RATING
  useEffect(() => {
    if (!pedidoId) return;

    async function cargarPedido() {
      const { data } = await supabase
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single();

      if (!data) return;

      let vendedor = null;
      let vendedor_rating = null;

      if (
        data.vendedor_id !== null &&
        data.vendedor_id !== undefined
      ) {
        const res = await fetch(
          "/api/orders/users/get-vendedor",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              vendedor_id: data.vendedor_id,
            }),
          }
        );

        const json = await res.json();
        const vend = json.data;

        vendedor = vend;

        if (vend?.id) {
          const { data: rating } = await supabase
            .from("ratings_resumen")
            .select(
              "rating_promedio, total_reviews"
            )
            .eq("user_id", vend.id)
            .maybeSingle();

          vendedor_rating = rating;
        }
      }

      setPedido({
        ...data,
        vendedor,
        vendedor_rating,
      });
    }

    cargarPedido();
  }, [pedidoId]);

  useEffect(() => {
    if (!pedidoId) return;

    supabase
      .from("pedido_establecimientos")
      .select(`
        establecimientos (
          id,
          uuid,
          usuario_id,
          nombre,
          direccion,
          lat,
          lng,
          horario,
          zona
        )
      `)
      .eq("pedido_id", pedidoId)
      .then(async ({ data }) => {
        const ests = (data || [])
          .map((r) => r.establecimientos)
          .filter(Boolean);

        const { data: ratings } = await supabase
          .from("ratings_resumen")
          .select(
            "user_id, rating_promedio, total_reviews"
          );

        const estsConRating = ests.map((e) => {
          const r = ratings?.find(
            (x) => x.user_id === e.uuid
          );

          return {
            ...e,
            rating_promedio:
              r?.rating_promedio ?? 0,
            total_reviews:
              r?.total_reviews ?? 0,
          };
        });

        setEstablecimientos(estsConRating);
      });
  }, [pedidoId]);

  const listaOrdenada =
    establecimientosFiltrados
      .map((e) => ({
        ...e,
        distancia: ubicacion
          ? calcularDistanciaKm(ubicacion, {
              lat: e.lat,
              lng: e.lng,
            })
          : null,
      }))
      .sort(
        (a, b) =>
          (a.distancia ?? 999) -
          (b.distancia ?? 999)
      );

  async function confirmarSeleccion() {
    if (!pedidoId || !seleccion) return;

    const res = await fetch(
      "/api/orders/confirmado",
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pedido_id: pedidoId,
          establecimiento_id: seleccion,
        }),
      }
    );

    if (!res.ok) {
      setMensaje(
        "❌ Error al confirmar el pedido"
      );
      return;
    }

    router.push(
      `/track/${pedido.folio}?confirmed=1`
    );
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

        {/* HEADER */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-lg space-y-4">

          <div className="flex items-center justify-between text-sm opacity-90">
            <span>Paso 2 de 3</span>
            <span>Selección de entrega</span>
          </div>

          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-white rounded-full"></div>
          </div>

          <h1 className="text-3xl font-bold">
            Selecciona tu punto de entrega
          </h1>

          {pedido && (
            <>
              <p className="text-white/90">
                Pedido{" "}
                <strong>{pedido.folio}</strong> —{" "}
                {pedido.producto}
              </p>

              {pedido?.vendedor && (
                <div className="text-white/90 text-sm mt-2 space-y-2">

                  <p>
                    Vendedor:{" "}
                    <strong>
                      {pedido.vendedor?.nombre ||
                        pedido.vendedor?.email ||
                        "Vendedor"}
                    </strong>
                  </p>

                  <StarsPromedio
                    evaluado_id={
                      pedido.vendedor.id
                    }
                    tipo="vendedor"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* FILTRO ZONAS */}
        {establecimientos.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">

            <p className="text-sm font-medium text-slate-700 mb-3">
              Filtrar por zona
            </p>

            <Select
              value={zonaFiltro}
              onValueChange={setZonaFiltro}
            >
              <SelectTrigger className="h-11 rounded-xl bg-white">
                <SelectValue placeholder="Selecciona zona" />
              </SelectTrigger>

              <SelectContent className="z-[9999]">
                <SelectItem value="todas">
                  Todas las zonas
                </SelectItem>

                <SelectItem value="Norte">
                  Zona Norte
                </SelectItem>

                <SelectItem value="Sur">
                  Zona Sur
                </SelectItem>

                <SelectItem value="Oriente">
                  Zona Oriente
                </SelectItem>

                <SelectItem value="Poniente">
                  Zona Poniente
                </SelectItem>

                <SelectItem value="Centro">
                  Zona Centro
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* MAPA */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-indigo-100 ring-1 ring-indigo-100">
          <div className="h-96">
            <MapaEstablecimientos
              establecimientos={
                establecimientosFiltrados
              }
              selectedPoint={ubicacion}
              onLocationSelected={
                setUbicacion
              }
            />
          </div>
        </div>

        {/* CONTADOR */}
        {seleccion && (
          <div className="text-sm text-indigo-600 font-semibold">
            1 punto seleccionado
          </div>
        )}

        {/* ESTABLECIMIENTOS */}
        <div className="space-y-4">

          <h2 className="text-2xl font-bold text-indigo-900">
            Establecimientos disponibles
          </h2>

          {listaOrdenada.map((e, index) => {
            const esMasCercano =
              index === 0 && e.distancia;

            return (
              <div
                key={e.id}
                onClick={() =>
                  setSeleccion(e.id)
                }
                className={`rounded-2xl p-6 cursor-pointer transition-all duration-300 border ${
                  seleccion === e.id
                    ? "border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl scale-[1.01]"
                    : "bg-white/90 backdrop-blur hover:shadow-xl hover:border-indigo-200 border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start">

                  <div>
                    <h3 className="font-semibold text-lg">
                      {e.nombre}
                    </h3>

                    <div className="mt-2">
                      <StarsPromedio
                        evaluado_id={e.uuid}
                        tipo="establecimiento"
                      />
                    </div>

                    <p className="text-sm mt-2 opacity-80">
                      {e.direccion}
                    </p>

                    <p className="text-xs mt-2 opacity-70">
                      Horario:{" "}
                      {e.horario ||
                        "Horario no especificado"}
                    </p>

                    <p className="text-xs mt-2 opacity-70">
                      Zona:{" "}
                      {e.zona || "No definida"}
                    </p>

                    {e.distancia && (
                      <p className="text-xs mt-2 opacity-70">
                        {e.distancia.toFixed(2)} km
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">

                    {esMasCercano && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        Más cercano
                      </span>
                    )}

                    {seleccion === e.id && (
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
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
          className={`w-full py-6 text-lg rounded-2xl ${
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