"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { supabase } from "@/lib/supabaseClient";
import CheckoutForm from "./checkout-form";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const PRECIO_SMALL = 60;
const PRECIO_MEDIUM = 90;

export default function ComprarCoinsPage() {
  const [small, setSmall] = useState(0);
  const [medium, setMedium] = useState(0);
  const [mensajeExito, setMensajeExito] = useState(false);

  const [coinsDisponibles, setCoinsDisponibles] = useState({
    small: 0,
    medium: 0,
  });

  // ----------------------------
  // 💰 CÁLCULOS
  // ----------------------------
  const subtotal =
    small * PRECIO_SMALL + medium * PRECIO_MEDIUM;

  const cantidadTotal = small + medium;
  const descuento =
    cantidadTotal >= 50 ? 0.12 : cantidadTotal >= 10 ? 0.1 : 0;

  const total = Math.round(subtotal * (1 - descuento));

  const items = [
    ...(small > 0 ? [{ tipo: "small", cantidad: small }] : []),
    ...(medium > 0 ? [{ tipo: "medium", cantidad: medium }] : []),
  ];

  // ----------------------------
  // 🔵 CARGAR COINS REALES
  // ----------------------------
  const cargarCoins = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    const { data: lotes } = await supabase
      .from("coin_lotes")
      .select("tipo, cantidad_disponible")
      .eq("user_id", data.user.id)
      .gt("cantidad_disponible", 0)
      .gt("fecha_expiracion", new Date().toISOString());

    const resumen = { small: 0, medium: 0 };

    lotes?.forEach((l) => {
      if (l.tipo === "small") resumen.small += l.cantidad_disponible;
      if (l.tipo === "medium") resumen.medium += l.cantidad_disponible;
    });

    setCoinsDisponibles(resumen);
  };

  useEffect(() => {
    cargarCoins();
  }, []);

  const handleSuccess = () => {
    setMensajeExito(true);
    setSmall(0);
    setMedium(0);
    cargarCoins();
    setTimeout(() => setMensajeExito(false), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* ✅ MENSAJE */}
      {mensajeExito && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 font-semibold">
          ✅ Coins compradas correctamente
        </div>
      )}

      <h1 className="text-3xl font-bold text-sky-700">
        Comprar Coins
      </h1>

      {/* 🔵 COINS DISPONIBLES */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
          <p className="text-sm text-sky-600">Coins Small disponibles</p>
          <p className="text-2xl font-bold text-sky-700">
            {coinsDisponibles.small}
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-sm text-indigo-600">Coins Medium disponibles</p>
          <p className="text-2xl font-bold text-indigo-700">
            {coinsDisponibles.medium}
          </p>
        </div>
      </div>

      {/* 🎁 PACKS */}
      <div className="space-y-3">
        <p className="font-semibold text-gray-700">
          Packs con descuento
        </p>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => {
              setSmall(10);
              setMedium(0);
            }}
            className="border rounded-xl p-4 hover:border-sky-500 text-left"
          >
            <p className="font-semibold">10 Small</p>
            <p className="text-sm text-green-600">10% descuento</p>
          </button>

          <button
            onClick={() => {
              setSmall(0);
              setMedium(10);
            }}
            className="border rounded-xl p-4 hover:border-sky-500 text-left"
          >
            <p className="font-semibold">10 Medium</p>
            <p className="text-sm text-green-600">10% descuento</p>
          </button>

          <button
            onClick={() => {
              setSmall(5);
              setMedium(5);
            }}
            className="border rounded-xl p-4 hover:border-sky-500 text-left"
          >
            <p className="font-semibold">5 + 5 Mixto</p>
            <p className="text-sm text-green-600">10% descuento</p>
          </button>
        </div>
      </div>

      {/* CONTADORES */}
      <div className="border rounded-xl p-4 flex justify-between">
        <div>
          <p className="font-semibold">Coin Small</p>
          <p className="text-sm">$60 MXN</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => setSmall(Math.max(0, small - 1))}>−</button>
          <span>{small}</span>
          <button onClick={() => setSmall(small + 1)}>+</button>
        </div>
      </div>

      <div className="border rounded-xl p-4 flex justify-between">
        <div>
          <p className="font-semibold">Coin Medium</p>
          <p className="text-sm">$90 MXN</p>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={() => setMedium(Math.max(0, medium - 1))}>−</button>
          <span>{medium}</span>
          <button onClick={() => setMedium(medium + 1)}>+</button>
        </div>
      </div>

      {/* 💰 RESUMEN */}
      <div className="bg-gray-50 border rounded-xl p-4 space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${subtotal} MXN</span>
        </div>

        {descuento > 0 && (
          <div className="flex justify-between text-green-600 font-semibold">
            <span>Descuento</span>
            <span>- {Math.round(descuento * 100)}%</span>
          </div>
        )}

        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>${total} MXN</span>
        </div>
      </div>

      {total > 0 && stripePromise && (
        <Elements stripe={stripePromise}>
          <CheckoutForm
            items={items}
            total={total}
            onSuccess={handleSuccess}
          />
        </Elements>
      )}
    </div>
  );
}
