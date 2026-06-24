"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SharePedidoCard from "@/components/ui/SharePedidoCard";
import StarsPromedio from "@/app/components/StarsPromedio";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import ProteccionCheckoutForm from "./proteccion-checkout-form";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const MapaEstablecimientos = dynamic(
  () => import("../../components/MapaEstablecimientos"),
  { ssr: false }
);

function generarFolio() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++)
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  return `EW-${result}`;
}

function toNumber(value) {
  return Number(String(value || "0").replace(",", "."));
}

export default function CrearPedido() {
  const [producto, setProducto] = useState("");
  const [tamano, setTamano] = useState("");
  const [correoComprador, setCorreoComprador] = useState("");
  const [pedidoCreado, setPedidoCreado] = useState(null);
  const topRef = useRef(null);

  const [establecimientos, setEstablecimientos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);
  const [zonaFiltro, setZonaFiltro] = useState("todas");

  const [coinsDisponibles, setCoinsDisponibles] = useState({
    small: 0,
    medium: 0,
  });

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [declaracionLegal, setDeclaracionLegal] = useState(false);

  const [proteccionEnabled, setProteccionEnabled] = useState(false);
  const [protegerPedido, setProtegerPedido] = useState(false);
  const [valorDeclarado, setValorDeclarado] = useState("");
  const [porcentajeProteccion, setPorcentajeProteccion] = useState(0);
  const [valorMaximoProteccion, setValorMaximoProteccion] = useState(0);

  const montoProteccion =
    protegerPedido && toNumber(valorDeclarado) > 0
      ? Number(
          ((toNumber(valorDeclarado) * porcentajeProteccion) / 100).toFixed(2)
        )
      : 0;

  async function cargarProteccionConfig() {
    const res = await fetch("/api/orders/proteccion/config");
    const data = await res.json();

    if (res.ok) {
      setProteccionEnabled(data.enabled);
      setPorcentajeProteccion(data.porcentaje);
      setValorMaximoProteccion(data.valorMaximo);
    }
  }

  async function debugCoinsDB(tag, userId) {
    const { data: lotes } = await supabase
      .from("coin_lotes")
      .select("id, tipo, cantidad_disponible, fecha_expiracion, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    console.log(`🧾 [${tag}] LOTES (todos):`, lotes);

    const { data: movs } = await supabase
      .from("coin_movimientos")
      .select("id, tipo, coin_tipo, cantidad, lote_id, referencia, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    console.log(`📌 [${tag}] MOVIMIENTOS (últimos 10):`, movs);
  }

  async function cargarCoins() {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const { data: lotes } = await supabase
      .from("coin_lotes")
      .select("tipo, cantidad_disponible, fecha_expiracion")
      .eq("user_id", data.user.id);

    const resumen = { small: 0, medium: 0 };

    lotes?.forEach((l) => {
      const noExpirada = new Date(l.fecha_expiracion) > new Date();
      if (l.cantidad_disponible > 0 && noExpirada) {
        if (l.tipo === "small") resumen.small += l.cantidad_disponible;
        if (l.tipo === "medium") resumen.medium += l.cantidad_disponible;
      }
    });

    setCoinsDisponibles(resumen);
  }

  useEffect(() => {
    cargarCoins();
    cargarProteccionConfig();
  }, []);

  useEffect(() => {
    if (tamano) cargarEstablecimientos();
  }, [tamano]);

  async function cargarEstablecimientos() {
    const columnaCap =
      tamano === "small" ? "capacidad_small" : "capacidad_medium";

    const { data, error } = await supabase.from("establecimientos").select("*");

    if (error) {
      setMensaje("Error cargando establecimientos");
      return;
    }

    const disponibles = data.filter((e) => Number(e[columnaCap]) > 0);

    setEstablecimientos(disponibles);
    setSeleccionados([]);
  }

  const establecimientosFiltrados =
    zonaFiltro === "todas"
      ? establecimientos
      : establecimientos.filter((e) => e.zona === zonaFiltro);

  function toggleEstablecimiento(est) {
    setSeleccionados((prev) =>
      prev.some((e) => e.id === est.id)
        ? prev.filter((e) => e.id !== est.id)
        : [...prev, est]
    );
  }

  function validarFormulario() {
    if (!producto || !tamano || !correoComprador || seleccionados.length === 0) {
      setMensaje(
        "Completa todos los campos y selecciona al menos un establecimiento."
      );
      return false;
    }

    if (!declaracionLegal) {
      setMensaje("Debes aceptar la declaración sobre el contenido del paquete.");
      return false;
    }

    if (protegerPedido) {
      const valor = toNumber(valorDeclarado);

      if (!valor || valor <= 0) {
        setMensaje("Ingresa un valor declarado válido.");
        return false;
      }

      if (valor > valorMaximoProteccion) {
        setMensaje(`El valor máximo asegurable es $${valorMaximoProteccion} MXN.`);
        return false;
      }
    }

    return true;
  }

  async function crearPedido(stripePaymentIntentId) {
    if (loading) return;
    setMensaje("");

    if (!validarFormulario()) return;

    if (protegerPedido && !stripePaymentIntentId) {
      setMensaje("Primero paga la protección para crear el pedido.");
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const vendedorId = userData?.user?.id;
      const vendedorEmail = userData?.user?.email;

      if (!vendedorId || !vendedorEmail) {
        setMensaje("No se pudo obtener el usuario vendedor.");
        return;
      }

      await debugCoinsDB("ANTES RPC", vendedorId);

      const folio = generarFolio();

      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          vendedor_id: vendedorId,
          email_vendedor: vendedorEmail,
          email_comprador: correoComprador,
          comprador_id: null,
          producto,
          tipo_paquete: tamano,
          estado: "creado",
          folio,
          declaracion_legal: declaracionLegal,
        })
        .select()
        .single();

      if (pedidoError || !pedido?.id) {
        setMensaje("Error al crear el pedido.");
        return;
      }

      const { error: coinError } = await supabase.rpc("consume_coin_for_order", {
        p_user_id: vendedorId,
        p_tamano: tamano,
      });

      await debugCoinsDB("DESPUÉS RPC", vendedorId);

      if (coinError) {
        setMensaje(`❌ Error al consumir coin: ${coinError.message}`);
        return;
      }

      const relaciones = seleccionados.map((e) => ({
        pedido_id: pedido.id,
        establecimiento_id: e.id,
      }));

      const { error: relError } = await supabase
        .from("pedido_establecimientos")
        .insert(relaciones);

      if (relError) {
        console.error("Error insertando relaciones:", relError);
        setMensaje("❌ Error guardando establecimientos");
        return;
      }

      if (protegerPedido) {
        const { error: proteccionError } = await supabase
          .from("pedido_protecciones")
          .insert({
            pedido_id: pedido.id,
            vendedor_id: vendedorId,
            valor_declarado: toNumber(valorDeclarado),
            porcentaje: porcentajeProteccion,
            monto_proteccion: montoProteccion,
            protegido: true,
            payment_status: "succeeded",
            stripe_payment_intent_id: stripePaymentIntentId,
          });

        if (proteccionError) {
  console.error(
    "Error guardando protección:",
    JSON.stringify(proteccionError, null, 2)
  );

  setMensaje(
    `Error protección: ${proteccionError.message || "desconocido"}`
  );

  return;
}
      }

      setMensaje(`✅ Pedido creado correctamente. Folio: ${folio}`);

      setPedidoCreado({
        folio,
        codigo: pedido.codigo_vendedor || "N/A",
        correo: correoComprador,
      });

      topRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      await fetch("/api/orders/email/pedido-creado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          correo: correoComprador,
          folio,
        }),
      });

      setProducto("");
      setTamano("");
      setCorreoComprador("");
      setEstablecimientos([]);
      setSeleccionados([]);
      setDeclaracionLegal(false);
      setProtegerPedido(false);
      setValorDeclarado("");

      await cargarCoins();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={topRef} className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-3">
        <div>
          <h1 className="text-4xl font-bold text-indigo-900">Crear Pedido</h1>

          <p className="text-slate-600 mt-2">
            Registra un nuevo envío usando tus coins disponibles.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-sky-600 mb-2">
              Coins disponibles (Paquetes pequeños)
            </p>

            <p className="text-2xl font-bold text-sky-700">
              {coinsDisponibles.small}
            </p>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-indigo-600 mb-2">
              Coins disponibles (Paquetes medianos)
            </p>

            <p className="text-2xl font-bold text-indigo-700">
              {coinsDisponibles.medium}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
          <Input
            placeholder="Nombre del producto"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            className="h-12 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />

          <Input
            placeholder="Correo del cliente"
            value={correoComprador}
            onChange={(e) => setCorreoComprador(e.target.value)}
            className="h-12 rounded-xl focus:ring-2 focus:ring-indigo-500"
          />

          <Select onValueChange={setTamano} value={tamano}>
            <SelectTrigger className="h-12 rounded-xl focus:ring-2 focus:ring-indigo-500">
              <SelectValue placeholder="Selecciona tamaño" />
            </SelectTrigger>

            <SelectContent className="z-[9999]">
              <SelectItem value="small">
                Pequeño (hasta 3 kg · máx 40 cm por lado)
              </SelectItem>

              <SelectItem value="medium">
                Mediano (hasta 10 kg · máx 70 cm por lado)
              </SelectItem>
            </SelectContent>
          </Select>

          <p className="text-xs text-amber-600 mt-2">
            ⚠️ El paquete no debe exceder el peso o tamaño indicado. El
            establecimiento puede rechazarlo.
          </p>

          {tamano && coinsDisponibles[tamano] === 0 && (
            <div className="border border-amber-300 bg-amber-50 rounded-2xl p-4 flex items-center justify-between">
              <p className="text-sm text-amber-800">
                No tienes coins <b>{tamano}</b> disponibles.
              </p>

              <Button
                variant="outline"
                className="border-amber-400 text-amber-800 hover:bg-amber-100 rounded-xl"
                onClick={() => (window.location.href = "/vendedor/coins")}
              >
                Comprar coins
              </Button>
            </div>
          )}

        {proteccionEnabled && (
  <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
          🛡️
        </div>

        <div>
          <h3 className="text-lg font-bold text-indigo-900">
            Protección Dropit
          </h3>
          <p className="text-sm text-slate-600">
            Cubre robo, extravío o daño mientras el pedido esté bajo custodia.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setProtegerPedido(!protegerPedido)}
        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
          protegerPedido ? "bg-indigo-600" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
            protegerPedido ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
    </div>

    {protegerPedido && (
      <div className="mt-5 space-y-3">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            Valor declarado
          </label>

          <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <span className="text-slate-500">$</span>
            <input
              type="number"
              min="500"
              placeholder="500"
              value={valorDeclarado}
              onChange={(e) => setValorDeclarado(e.target.value)}
              className="h-12 w-full bg-transparent px-2 text-lg font-semibold outline-none"
            />
            <span className="text-sm text-slate-500">MXN</span>
          </div>

          {toNumber(valorDeclarado) > 0 && toNumber(valorDeclarado) < 500 && (
            <p className="mt-2 text-sm font-medium text-amber-600">
              El valor mínimo asegurable es $500 MXN.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-5 text-white">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-80">
                Costo de protección
              </p>
              <p className="mt-1 text-3xl font-bold">
                ${montoProteccion} MXN
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-wide opacity-80">
                Cobertura hasta
              </p>
              <p className="mt-1 text-xl font-bold">
                ${toNumber(valorDeclarado) || 0} MXN
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              Protección aplicada
            </span>
            <span className="font-bold text-indigo-700">
              {porcentajeProteccion}%
            </span>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
            <p>✓ Robo dentro del establecimiento</p>
            <p>✓ Extravío bajo custodia</p>
            <p>✓ Daño bajo custodia</p>
            <p>✕ No cubre robo fuera del establecimiento</p>
            <p className="md:col-span-2">
              ✕ No cubre falta de pago entre comprador y vendedor
            </p>
          </div>

          <p className="mt-3 border-t pt-3 text-xs text-slate-500">
            Mínimo asegurable: $500 MXN · Máximo asegurable: $
            {valorMaximoProteccion} MXN
          </p>
        </div>

      </div>
    )}
  </div>
)}
</div>

        {establecimientos.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Filtrar por zona
            </p>

            <Select value={zonaFiltro} onValueChange={setZonaFiltro}>
              <SelectTrigger className="h-11 rounded-xl bg-white">
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
        )}

        {establecimientos.length > 0 && (
          <div className="relative z-0 h-[420px] w-full rounded-3xl overflow-hidden border border-indigo-100 shadow-2xl ring-1 ring-indigo-100">
            <MapaEstablecimientos
              establecimientos={establecimientosFiltrados}
              seleccionados={seleccionados}
              onMarkerClick={toggleEstablecimiento}
            />
          </div>
        )}

        {establecimientos.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-indigo-900">
              Establecimientos permitidos
            </h2>

            {establecimientosFiltrados.map((est) => {
              const activo = seleccionados.some((e) => e.id === est.id);

              return (
                <div
                  key={est.id}
                  onClick={() => toggleEstablecimiento(est)}
                  className={`border rounded-2xl p-6 cursor-pointer transition-all duration-200 ${
                    activo
                      ? "border-transparent bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl scale-[1.01]"
                      : "bg-white/90 backdrop-blur hover:shadow-xl hover:border-indigo-200 border-slate-200"
                  }`}
                >
                  <h3 className="font-semibold text-lg">{est.nombre}</h3>

                  <div className="mt-2">
                    <StarsPromedio
                      evaluado_id={est.uuid}
                      tipo="establecimiento"
                    />
                  </div>

                  <p className="text-sm mt-2 opacity-80">{est.direccion}</p>

                  <p className="text-xs mt-2 opacity-70">
                    Pequeño: {est.capacidad_small} — Mediano:{" "}
                    {est.capacidad_medium}
                  </p>
                </div>
              );
            })}
          </div>
        )}



        {!protegerPedido && (
          <Button
            className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow hover:shadow-lg transition-all"
            onClick={() => crearPedido()}
            disabled={loading}
          >
            {loading ? "Creando pedido..." : "Crear Pedido"}
          </Button>
        )}

        <div className="mt-3 flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <input
            type="checkbox"
            checked={declaracionLegal}
            onChange={(e) => setDeclaracionLegal(e.target.checked)}
            className="mt-1"
          />

          <p className="text-sm text-slate-600">
            Declaro que el paquete no contiene artículos ilegales, sustancias
            prohibidas, armas, dinero en efectivo u otros bienes restringidos
            según los{" "}
            <Link href="/terminos" className="text-indigo-600 underline">
              Términos y Condiciones
            </Link>
            .
          </p>
        </div>

        {protegerPedido && stripePromise && (
  <div className="mt-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <Elements stripe={stripePromise}>
              <ProteccionCheckoutForm
                valorDeclarado={toNumber(valorDeclarado)}
                montoProteccion={montoProteccion}
                onPaymentSuccess={(paymentIntentId) =>
                  crearPedido(paymentIntentId)
                }
              />
            </Elements>
          </div>
        )}

        {mensaje && (
          <p
            className={`text-center font-medium ${
              mensaje.startsWith("✅") ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {mensaje}
          </p>
        )}

        {pedidoCreado && (
          <SharePedidoCard
            folio={pedidoCreado.folio}
            codigo={pedidoCreado.codigo}
            correo={pedidoCreado.correo}
          />
        )}
      </div>
    </div>
    
  );
}