"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import StarsPromedio from "@/app/components/StarsPromedio";
import FlowGuideModal from "@/components/ui/FlowGuideModal";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  MapPin,
  Clock,
  CheckCircle2,
  Store,
  Copy,
  ExternalLink,
  X,
} from "lucide-react";

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
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function CompradorPage() {
  const [pedidoId, setPedidoId] = useState(null);
  const [pedido, setPedido] = useState(null);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [zonaFiltro, setZonaFiltro] = useState("todas");
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [popupFeedback, setPopupFeedback] = useState("");

  const router = useRouter();

  const establecimientosFiltrados =
    zonaFiltro === "todas"
      ? establecimientos
      : establecimientos.filter((e) => e.zona === zonaFiltro);

  useEffect(() => {
    const pid = sessionStorage.getItem("pedido_id");
    if (pid) setPedidoId(Number(pid));
  }, []);

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

      if (data.vendedor_id !== null && data.vendedor_id !== undefined) {
        const res = await fetch("/api/orders/users/get-vendedor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendedor_id: data.vendedor_id }),
        });

        const json = await res.json();
        const vend = json.data;

        vendedor = vend;

        if (vend?.id) {
          const { data: rating } = await supabase
            .from("ratings_resumen")
            .select("rating_promedio, total_reviews")
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
          .select("user_id, rating_promedio, total_reviews");

        const estsConRating = ests.map((e) => {
          const r = ratings?.find((x) => x.user_id === e.uuid);

          return {
            ...e,
            rating_promedio: r?.rating_promedio ?? 0,
            total_reviews: r?.total_reviews ?? 0,
          };
        });

        setEstablecimientos(estsConRating);
      });
  }, [pedidoId]);

  const listaOrdenada = establecimientosFiltrados
    .map((e) => ({
      ...e,
      distancia: ubicacion
        ? calcularDistanciaKm(ubicacion, {
            lat: e.lat,
            lng: e.lng,
          })
        : null,
    }))
    .sort((a, b) => (a.distancia ?? 999) - (b.distancia ?? 999));

  const establecimientoSeleccionado = listaOrdenada.find(
    (e) => e.id === seleccion
  );

  function copiarFolio() {
    if (!pedido?.folio) return;

    navigator.clipboard.writeText(pedido.folio);
    setPopupFeedback("Folio copiado");
    setTimeout(() => setPopupFeedback(""), 2500);
  }

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

    setShowConfirmPopup(true);
  }

  if (!pedidoId) {
    return (
      <p className="text-center mt-10 text-slate-500">
        No hay pedido validado
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-5 py-12 pb-36">
     {showConfirmPopup && pedido && (
  <FlowGuideModal
    title="¡Punto de entrega confirmado!"
    subtitle="Excelente elección. Ahora solo espera mientras el establecimiento revisa tu pedido."
    heroLabel="Folio del pedido"
    heroValue={pedido.folio}
    feedback={popupFeedback}
    onClose={() => setShowConfirmPopup(false)}
    onCopyHeroValue={copiarFolio}
    tip="Guarda este folio. Lo necesitarás para consultar el estado de tu pedido cuando quieras."
    steps={[
      {
        emoji: "🚚",
        title: "El vendedor llevará el paquete",
        text: "Una vez aprobado, el vendedor entregará tu paquete en el establecimiento elegido.",
      },
      {
        emoji: "📧",
        title: "Te avisaremos",
        text: "Cuando el paquete esté listo para recoger recibirás un correo.",
      },
      {
        emoji: "📲",
        title: "Sigue tu pedido",
        text: "Puedes consultar el avance en cualquier momento usando tu folio.",
      },
    ]}
    actions={[
      {
        label: "Copiar folio",
        icon: <Copy size={18} />,
        onClick: copiarFolio,
        variant: "outline",
      },
      {
        label: "Ver seguimiento",
        icon: <ExternalLink size={18} />,
        onClick: () =>
          router.push(`/track/${pedido.folio}?confirmed=1`),
        variant: "primary",
      },
    ]}
  />
)}

      <div className="max-w-6xl mx-auto space-y-6"> 
        <section className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Paso 2 de 3 · Punto de entrega
              </p>

              <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#1e3a8a]">
                Selecciona dónde recogerás tu pedido
              </h1>

              {pedido && (
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>
                    Pedido{" "}
                    <strong className="text-[#1e3a8a]">{pedido.folio}</strong>{" "}
                    — {pedido.producto}
                  </p>

                  {pedido?.vendedor && (
                    <div className="flex flex-col gap-2">
                      <p>
                        Vendedor:{" "}
                        <strong>
                          {pedido.vendedor?.nombre ||
                            pedido.vendedor?.email ||
                            "Vendedor"}
                        </strong>
                      </p>

                      <StarsPromedio
                        evaluado_id={pedido.vendedor.id}
                        tipo="vendedor"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 px-5 py-4 text-[#1e3a8a]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                Progreso
              </p>
              <div className="mt-3 h-2 w-44 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full w-2/3 rounded-full bg-[#2563eb]" />
              </div>
            </div>
          </div>
        </section>

        {establecimientos.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#2563eb]">
                  <MapPin size={18} />
                </div>

                <div>
                  <p className="font-semibold text-[#1e3a8a]">
                    Filtrar por zona
                  </p>
                  <p className="text-xs text-slate-500">
                    {establecimientosFiltrados.length} establecimiento(s)
                    disponible(s)
                  </p>
                </div>
              </div>

              <div className="w-full md:w-72">
                <Select value={zonaFiltro} onValueChange={setZonaFiltro}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-slate-300">
                    <SelectValue placeholder="Selecciona zona" />
                  </SelectTrigger>

                  <SelectContent className="z-[9999]">
                    <SelectItem value="todas">Todas las zonas</SelectItem>
                    <SelectItem value="Norte">Zona Norte</SelectItem>
                    <SelectItem value="Sur">Zona Sur</SelectItem>
                    <SelectItem value="Oriente">Zona Oriente</SelectItem>
                    <SelectItem value="Poniente">Zona Poniente</SelectItem>
                    <SelectItem value="Centro">Zona Centro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="h-[420px]">
            <MapaEstablecimientos
              establecimientos={establecimientosFiltrados}
              selectedPoint={ubicacion}
              onLocationSelected={setUbicacion}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Establecimientos
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[#1e3a8a]">
                Elige tu punto de entrega
              </h2>
            </div>

            {seleccion && (
              <p className="text-sm font-semibold text-[#2563eb]">
                1 punto seleccionado
              </p>
            )}
          </div>

          {listaOrdenada.map((e, index) => {
            const esMasCercano = index === 0 && e.distancia;
            const activo = seleccion === e.id;

            return (
              <div
                key={e.id}
                onClick={() => setSeleccion(e.id)}
                className={`cursor-pointer rounded-3xl border p-5 md:p-6 transition-all ${
                  activo
                    ? "border-[#2563eb] bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                          activo
                            ? "bg-white text-[#2563eb]"
                            : "bg-blue-50 text-[#2563eb]"
                        }`}
                      >
                        <Store size={18} />
                      </div>

                      <h3 className="font-bold text-lg text-[#1e3a8a]">
                        {e.nombre}
                      </h3>

                      {esMasCercano && (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Más cercano
                        </span>
                      )}

                      {activo && (
                        <span className="rounded-full bg-[#2563eb] px-3 py-1 text-xs font-semibold text-white">
                          Seleccionado
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <StarsPromedio
                        evaluado_id={e.uuid}
                        tipo="establecimiento"
                      />
                    </div>

                    <p className="mt-3 text-sm text-slate-600">
                      {e.direccion}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        <Clock size={13} />
                        {e.horario || "Horario no especificado"}
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                        <MapPin size={13} />
                        Zona: {e.zona || "No definida"}
                      </span>

                      {e.distancia && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                          {e.distancia.toFixed(2)} km
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    className={`rounded-xl px-5 ${
                      activo
                        ? "bg-[#2563eb] text-white hover:bg-[#1e40af]"
                        : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#2563eb]"
                    }`}
                  >
                    {activo ? (
                      <>
                        <CheckCircle2 size={16} className="mr-2" />
                        Seleccionado
                      </>
                    ) : (
                      "Seleccionar"
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </section>

        {mensaje && (
          <p className="text-center text-red-600 mt-4 font-medium">{mensaje}</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-xl px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Punto seleccionado
            </p>
            <p className="font-bold text-[#1e3a8a]">
              {establecimientoSeleccionado
                ? establecimientoSeleccionado.nombre
                : "Selecciona un establecimiento para continuar"}
            </p>
          </div>

          <Button
            disabled={!seleccion}
            onClick={confirmarSeleccion}
            className={`h-12 rounded-xl px-8 font-semibold ${
              seleccion
                ? "bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white shadow hover:shadow-lg"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            Confirmar punto de entrega
          </Button>
        </div>
      </div>
    </div>
  );
}