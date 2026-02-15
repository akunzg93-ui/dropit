"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import dynamic from "next/dynamic";

// 🔹 MAPA sin SSR
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

export default function CrearPedido() {
  const [producto, setProducto] = useState("");
  const [tamano, setTamano] = useState("");
  const [correoComprador, setCorreoComprador] = useState("");

  const [establecimientos, setEstablecimientos] = useState([]);
  const [seleccionados, setSeleccionados] = useState([]);

  const [coinsDisponibles, setCoinsDisponibles] = useState({
    small: 0,
    medium: 0,
  });

  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // DEBUG helper: ver DB coins
  // -------------------------------
  async function debugCoinsDB(tag, userId) {
    const { data: lotes } = await supabase
      .from("coin_lotes")
      .select("id, tipo, cantidad_disponible, fecha_expiracion, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    console.log(`🧾 [${tag}] LOTES (todos):`, lotes);

    const { data: movs } = await supabase
      .from("coin_movimientos")
      .select(
        "id, tipo, coin_tipo, cantidad, lote_id, referencia, created_at"
      )
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
  }, []);

  useEffect(() => {
    if (tamano) cargarEstablecimientos();
  }, [tamano]);

  async function cargarEstablecimientos() {
    const columnaCap =
      tamano === "small" ? "capacidad_small" : "capacidad_medium";

    const { data, error } = await supabase
      .from("establecimientos")
      .select("*");

    if (error) {
      setMensaje("Error cargando establecimientos");
      return;
    }

    const disponibles = data.filter(
      (e) => Number(e[columnaCap]) > 0
    );

    setEstablecimientos(disponibles);
    setSeleccionados([]);
  }

  function toggleEstablecimiento(est) {
    setSeleccionados((prev) =>
      prev.some((e) => e.id === est.id)
        ? prev.filter((e) => e.id !== est.id)
        : [...prev, est]
    );
  }

  async function crearPedido() {
    if (loading) return;
    setMensaje("");
    setLoading(true);

    try {
      if (
        !producto ||
        !tamano ||
        !correoComprador ||
        seleccionados.length === 0
      ) {
        setMensaje(
          "Completa todos los campos y selecciona al menos un establecimiento."
        );
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const vendedorId = userData?.user?.id;
      const vendedorEmail = userData?.user?.email;

      if (!vendedorId || !vendedorEmail) {
        setMensaje("No se pudo obtener el usuario vendedor.");
        return;
      }

      await debugCoinsDB("ANTES RPC", vendedorId);

      const folio = generarFolio();

      // 1️⃣ Crear pedido (SOLO se agrega email_vendedor)
      const { data: pedido, error: pedidoError } = await supabase
        .from("pedidos")
        .insert({
          vendedor_id: vendedorId,
          email_vendedor: vendedorEmail,
          email_comprador: correoComprador,
          comprador_id: null,
          producto,
          tamano,
          estado: "creado",
          folio,
        })
        .select()
        .single();

      if (pedidoError || !pedido?.id) {
        setMensaje("Error al crear el pedido.");
        return;
      }

      // 2️⃣ Consumir coin (SIN TOCAR)
      const { error: coinError } = await supabase.rpc(
        "consume_coin_for_order",
        {
          p_user_id: vendedorId,
          p_tamano: tamano,
        }
      );

      await debugCoinsDB("DESPUÉS RPC", vendedorId);

      if (coinError) {
        setMensaje(`❌ Error al consumir coin: ${coinError.message}`);
        return;
      }

      // 3️⃣ Relación pedido - establecimientos (SIN TOCAR)
      const relaciones = seleccionados.map((e) => ({
        pedido_id: pedido.id,
        establecimiento_id: e.id,
      }));

      await supabase
        .from("pedido_establecimientos")
        .insert(relaciones);



      setMensaje(`✅ Pedido creado correctamente. Folio: ${folio}`);

      setProducto("");
      setTamano("");
      setCorreoComprador("");
      setEstablecimientos([]);
      setSeleccionados([]);

      await cargarCoins();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Crear Pedido</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sm text-sky-600">
            Coins Small disponibles
          </p>
          <p className="text-2xl font-bold text-sky-700">
            {coinsDisponibles.small}
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-600">
            Coins Medium disponibles
          </p>
          <p className="text-2xl font-bold text-indigo-700">
            {coinsDisponibles.medium}
          </p>
        </div>
      </div>

      <Input
        placeholder="Nombre del producto"
        value={producto}
        onChange={(e) => setProducto(e.target.value)}
      />

      <Input
        placeholder="Correo del comprador"
        value={correoComprador}
        onChange={(e) => setCorreoComprador(e.target.value)}
      />

      <Select onValueChange={setTamano} value={tamano}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona tamaño" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="small">
            Pequeño (&lt; 3 kg)
          </SelectItem>
          <SelectItem value="medium">
            Mediano (3–10 kg)
          </SelectItem>
        </SelectContent>
      </Select>

      {/* 🔔 BOTÓN PARA COMPRAR COINS (SOLO UX) */}
      {tamano && coinsDisponibles[tamano] === 0 && (
        <div className="border border-amber-300 bg-amber-50 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            No tienes coins <b>{tamano}</b> disponibles para crear este pedido.
          </p>

          <Button
            variant="outline"
            className="border-amber-400 text-amber-800 hover:bg-amber-100"
            onClick={() => (window.location.href = "/vendedor/coins")}
          >
            Comprar coins
          </Button>
        </div>
      )}

      {establecimientos.length > 0 && (
        <div className="h-[400px] w-full rounded overflow-hidden border">
          <MapaEstablecimientos
            establecimientos={establecimientos}
            seleccionados={seleccionados}
            onMarkerClick={toggleEstablecimiento}
          />
        </div>
      )}

      <h2 className="text-lg font-semibold">
        Establecimientos permitidos
      </h2>

      <div className="space-y-3">
        {establecimientos.map((est) => {
          const activo = seleccionados.some(
            (e) => e.id === est.id
          );
          return (
            <div
              key={est.id}
              onClick={() => toggleEstablecimiento(est)}
              className={`border p-4 rounded cursor-pointer transition ${
                activo
                  ? "bg-green-700 text-white"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <h3 className="font-semibold">{est.nombre}</h3>
              <p className="text-sm">{est.direccion}</p>
              <p className="text-xs mt-1">
                Small: {est.capacidad_small} — Medium:{" "}
                {est.capacidad_medium}
              </p>
            </div>
          );
        })}
      </div>

      <Button
        className="w-full"
        onClick={crearPedido}
        disabled={loading}
      >
        {loading ? "Creando pedido..." : "Crear Pedido"}
      </Button>

      {mensaje && (
        <p
          className={`text-center ${
            mensaje.startsWith("✅")
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {mensaje}
        </p>
      )}
    </div>
  );
}
