"use client";

import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function ProteccionCheckoutForm({
  valorDeclarado,
  montoProteccion,
  onPaymentSuccess,
}: any) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders/proteccion/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valorDeclarado }),
      });

      const intent = await res.json();

      if (!res.ok || !intent.clientSecret) {
        throw new Error(intent.error || "No se pudo crear el pago");
      }

      const result = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Pago rechazado");
      }

      if (result.paymentIntent?.status === "succeeded") {
        await onPaymentSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || "Error en el pago");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <CardElement className="p-3 border rounded-xl bg-white" />

      <button
        type="button"
        onClick={handlePay}
        disabled={!stripe || loading}
        className="w-full h-12 rounded-xl bg-black text-white font-semibold"
      >
        {loading
          ? "Procesando..."
          : `Pagar protección $${montoProteccion} MXN y crear pedido`}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}