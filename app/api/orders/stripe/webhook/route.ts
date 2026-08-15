import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function mapFundingToSat(
  funding?: string | null
): string | null {
  if (funding === "credit") {
    return "04";
  }

  if (funding === "debit") {
    return "28";
  }

  /*
    prepaid / unknown:
    no asignamos clave SAT sin una regla
    fiscal explícitamente definida.
  */
  return null;
}

export async function POST(req: Request) {
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error(
      "STRIPE_WEBHOOK_SECRET no configurado"
    );

    return NextResponse.json(
      {
        error:
          "Webhook de Stripe no configurado",
      },
      { status: 500 }
    );
  }

  const signature = req.headers.get(
    "stripe-signature"
  );

  if (!signature) {
    return NextResponse.json(
      {
        error:
          "Stripe-Signature faltante",
      },
      { status: 400 }
    );
  }

  /*
    Stripe exige el body RAW para
    verificar la firma.

    No usar req.json() antes de
    constructEvent().
  */
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event =
      stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
  } catch (error) {
    console.error(
      "❌ Firma de webhook inválida:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Firma de webhook inválida",
      },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const eventPaymentIntent =
          event.data
            .object as Stripe.PaymentIntent;

        const pagoId =
          eventPaymentIntent.metadata
            ?.pago_id;

        if (!pagoId) {
          /*
            Puede existir algún PaymentIntent
            ajeno al flujo de Coins de Dropit.

            No lo tratamos como error del webhook.
          */
          console.log(
            "ℹ️ PaymentIntent sin pago_id Dropit:",
            eventPaymentIntent.id
          );

          break;
        }

        // -----------------------------------------
        // 1. Recuperar PaymentIntent completo
        // -----------------------------------------

        const paymentIntent =
          await stripe.paymentIntents.retrieve(
            eventPaymentIntent.id,
            {
              expand: [
                "latest_charge",
              ],
            }
          );

        if (
          paymentIntent.status !==
          "succeeded"
        ) {
          throw new Error(
            "PAYMENT_INTENT_NOT_SUCCEEDED"
          );
        }

        // -----------------------------------------
        // 2. Validar datos fundamentales
        // -----------------------------------------

        const metadataPagoId =
          paymentIntent.metadata
            ?.pago_id;

        if (
          !metadataPagoId ||
          metadataPagoId !== pagoId
        ) {
          throw new Error(
            "STRIPE_PAGO_ID_MISMATCH"
          );
        }

        const charge =
          typeof paymentIntent.latest_charge ===
          "object"
            ? paymentIntent.latest_charge
            : null;

        if (!charge) {
          throw new Error(
            "STRIPE_CHARGE_NOT_FOUND"
          );
        }

        // -----------------------------------------
        // 3. Obtener forma real de pago
        // -----------------------------------------

        const paymentMethodDetails =
          charge.payment_method_details;

        const paymentMethodType =
          paymentMethodDetails?.type ||
          "unknown";

        const cardDetails =
          paymentMethodDetails?.card;

        const cardFunding =
          cardDetails?.funding ||
          "unknown";

        const cardBrand =
          cardDetails?.brand ||
          null;

        const cardLast4 =
          cardDetails?.last4 ||
          null;

        const formaPagoSat =
          mapFundingToSat(
            cardFunding
          );

        // -----------------------------------------
        // 4. Acreditar compra en PostgreSQL
        //
        // Esta RPC es transaccional e
        // idempotente.
        // -----------------------------------------

        const supabase =
          getSupabaseAdmin();

        const {
          error: rpcError,
        } = await supabase.rpc(
          "acreditar_compra_stripe",
          {
            p_pago_id:
              pagoId,

            p_payment_intent_id:
              paymentIntent.id,

            p_card_funding:
              cardFunding,

            p_payment_method_type:
              paymentMethodType,

            p_card_brand:
              cardBrand,

            p_card_last4:
              cardLast4,

            p_forma_pago_sat:
              formaPagoSat,
          }
        );

        if (rpcError) {
          console.error(
            "❌ Error acreditando compra Stripe:",
            rpcError
          );

          throw new Error(
            "STRIPE_COIN_CREDIT_FAILED"
          );
        }

        console.log(
          "✅ Compra Stripe acreditada",
          {
            pago_id:
              pagoId,

            payment_intent_id:
              paymentIntent.id,

            amount:
              paymentIntent.amount_received,

            currency:
              paymentIntent.currency,

            payment_method_type:
              paymentMethodType,

            card_funding:
              cardFunding,

            card_brand:
              cardBrand,

            card_last4:
              cardLast4,

            forma_pago_sat:
              formaPagoSat,
          }
        );

        break;
      }

      default: {
        console.log(
          `ℹ️ Evento Stripe ignorado: ${event.type}`
        );
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "❌ Error procesando webhook Stripe:",
      error
    );

    /*
      Respondemos 500 para que Stripe pueda
      reintentar el evento.

      Como acreditar_compra_stripe() es
      idempotente, un reintento no duplica
      Coins si la compra ya quedó acreditada.
    */
    return NextResponse.json(
      {
        error:
          "Error procesando webhook",
      },
      { status: 500 }
    );
  }
}