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
      const res = await fetch("/api/orders/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      const intent = await res.json();

      if (!intent.clientSecret) {
        throw new Error("No se pudo crear el pago");
      }

      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Pago rechazado");
      }

      if (result.paymentIntent?.status === "succeeded") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Usuario no autenticado");
        }

        await fetch("/api/orders/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_intent_id: result.paymentIntent.id,
          }),
        });

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
      <CardElement
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 shadow-sm"
        options={{
          hidePostalCode: true,
          style: {
            base: {
              fontSize: "16px",
              color: "#0f172a",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
              "::placeholder": {
                color: "#94a3b8",
              },
            },
            invalid: {
              color: "#dc2626",
            },
          },
        }}
      />

      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || loading}
        className="w-full rounded-xl bg-[#2563eb] px-5 py-3 font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Procesando..." : `Pagar $${total} MXN`}
      </button>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}