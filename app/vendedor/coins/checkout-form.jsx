"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutForm({ items, total, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      // 1️⃣ Crear PaymentIntent
      const res = await fetch("/api/orders/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const intent = await res.json();

      if (!intent.clientSecret) {
        throw new Error("No se pudo crear el pago");
      }

      // 2️⃣ Confirmar pago con tarjeta
      const result = await stripe.confirmCardPayment(
        intent.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (result.error) {
        throw new Error(result.error.message || "Pago rechazado");
      }

      // 3️⃣ Pago exitoso
      if (result.paymentIntent?.status === "succeeded") {
        // 🔐 Usuario actual
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Usuario no autenticado");
        }

        // 4️⃣ Confirmar pago (lo que ya tenías)
        await fetch("/api/orders/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_intent_id: result.paymentIntent.id,
          }),
        });

        // 5️⃣ 🚀 CREAR COINS (ESTO FALTABA)
        const coinsRes = await fetch("/api/orders/coins/comprar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            items,
          }),
        });

        if (!coinsRes.ok) {
          throw new Error("Pago hecho, pero error creando coins");
        }

        onSuccess?.();
      }
    } catch (err) {
      setError(err.message || "Error en el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <CardElement className="p-3 border rounded" />

      <button
        onClick={handlePay}
        disabled={!stripe || loading}
        className="w-full bg-black text-white py-2 rounded"
      >
        {loading ? "Procesando..." : `Pagar $${total} MXN`}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
