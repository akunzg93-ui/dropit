"use client";

import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function CheckoutForm({
  items,
  total,
  cupon,
  onSuccess,
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  async function handlePay() {
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    try {
      // -----------------------------------------
      // 1. Obtener sesión autenticada
      // -----------------------------------------

      const {
        data: { session },
      } =
        await supabase.auth.getSession();

      if (
        !session?.access_token ||
        !session.user
      ) {
        throw new Error(
          "Usuario no autenticado"
        );
      }

      // -----------------------------------------
      // 2. Crear pago + PaymentIntent
      // -----------------------------------------

      const res = await fetch(
        "/api/orders/payments/create-intent",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`,
          },

         body: JSON.stringify({
  items,
  cupon: cupon || null,
}),
        }
      );

      const intent =
        await res.json();

      if (
        !res.ok ||
        !intent.clientSecret
      ) {
        throw new Error(
          intent.error ||
            "No se pudo crear el pago"
        );
      }

      // -----------------------------------------
      // 3. Confirmar tarjeta con Stripe
      // -----------------------------------------

      const cardElement =
        elements.getElement(
          CardElement
        );

      if (!cardElement) {
        throw new Error(
          "No se pudo obtener la tarjeta"
        );
      }

      const result =
        await stripe.confirmCardPayment(
          intent.clientSecret,
          {
            payment_method: {
              card: cardElement,
            },
          }
        );

      if (result.error) {
        throw new Error(
          result.error.message ||
            "Pago rechazado"
        );
      }

      // -----------------------------------------
      // 4. Pago confirmado
      // -----------------------------------------

      if (
        result.paymentIntent
          ?.status === "succeeded"
      ) {
        /*
          TEMPORAL:

          Hasta que el webhook sea quien
          acredite coin_lotes, conservamos
          esta llamada.

          Después la eliminaremos.
        */

        onSuccess?.();

        return;
      }

      throw new Error(
        "El pago no pudo confirmarse"
      );
    } catch (err) {
      console.error(
        "Error procesando compra:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Error en el pago"
      );
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
        disabled={
          !stripe || loading
        }
        className="w-full rounded-xl bg-[#2563eb] px-5 py-3 font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Procesando..."
          : `Pagar $${total} MXN`}
      </button>

      {error && (
        <p className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}