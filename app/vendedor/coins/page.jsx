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
  // 💰 CÁLCULOS (NO MODIFICADOS)
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
  // 🔵 CARGAR COINS REALES (NO MODIFICADO)
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
    <div className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* MENSAJE */}
        {mensajeExito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 font-semibold shadow-sm">
            ✅ Coins compradas correctamente
          </div>
        )}

        {/* HEADER */}
        <div>
          <h1 className="text-4xl font-bold text-indigo-900">
            Comprar Coins
          </h1>
          <p className="text-slate-600 mt-2">
            Adquiere coins para registrar nuevos envíos.
          </p>
        </div>

        {/* SALDO ACTUAL */}
        <div className="grid md:grid-cols-2 gap-6">
          <SaldoCard
            label="Coins Small disponibles"
            value={coinsDisponibles.small}
            variant="small"
          />
          <SaldoCard
            label="Coins Medium disponibles"
            value={coinsDisponibles.medium}
            variant="medium"
          />
        </div>

        {/* SELECTORES */}
        <div className="space-y-6">
          <CoinSelector
            title="Coin Small"
            price={PRECIO_SMALL}
            qty={small}
            setQty={setSmall}
            variant="small"
          />
          <CoinSelector
            title="Coin Medium"
            price={PRECIO_MEDIUM}
            qty={medium}
            setQty={setMedium}
            variant="medium"
          />
        </div>

        {/* RESUMEN PREMIUM */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl p-8 shadow-lg space-y-3">

          <div className="flex justify-between opacity-90">
            <span>Subtotal</span>
            <span>${subtotal} MXN</span>
          </div>

          {descuento > 0 && (
            <div className="flex justify-between text-emerald-300 font-semibold">
              <span>Descuento</span>
              <span>- {Math.round(descuento * 100)}%</span>
            </div>
          )}

          <div className="flex justify-between text-2xl font-bold pt-2 border-t border-white/30">
            <span>Total</span>
            <span>${total} MXN</span>
          </div>

          {total > 0 && stripePromise && (
            <div className="pt-4">
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  items={items}
                  total={total}
                  onSuccess={handleSuccess}
                />
              </Elements>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ---------------- COMPONENTES VISUALES ---------------- */

function SaldoCard({ label, value, variant }) {
  const styles =
    variant === "small"
      ? "bg-sky-50 border-sky-200 text-sky-700"
      : "bg-indigo-50 border-indigo-200 text-indigo-700";

  return (
    <div className={`border rounded-2xl p-6 shadow-sm ${styles}`}>
      <p className="text-sm mb-2 opacity-80">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function CoinSelector({ title, price, qty, setQty, variant }) {
  const containerStyle =
    variant === "small"
      ? "bg-sky-50 border-sky-200"
      : "bg-indigo-50 border-indigo-200";

  const buttonStyle =
    variant === "small"
      ? "bg-sky-100 hover:bg-sky-200 text-sky-700"
      : "bg-indigo-100 hover:bg-indigo-200 text-indigo-700";

  return (
    <div className={`border rounded-2xl p-6 shadow-sm flex justify-between items-center ${containerStyle}`}>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-sm text-slate-600">${price} MXN</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setQty(Math.max(0, qty - 1))}
          className={`w-8 h-8 rounded-lg ${buttonStyle}`}
        >
          –
        </button>

        <span className="w-6 text-center font-semibold text-slate-900">
          {qty}
        </span>

        <button
          onClick={() => setQty(qty + 1)}
          className={`w-8 h-8 rounded-lg ${buttonStyle}`}
        >
          +
        </button>
      </div>
    </div>
  );
}