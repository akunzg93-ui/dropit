import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Sesión requerida" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "paymentIntentId requerido" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    if (paymentIntent.metadata?.vendedor_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado para reembolsar este pago" },
        { status: 403 }
      );
    }

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "El pago no está en estado succeeded" },
        { status: 409 }
      );
    }

    const refund = await stripe.refunds.create(
  {
    payment_intent: paymentIntentId,
    metadata: {
      motivo: "compensacion_creacion_pedido",
      vendedor_id: user.id,
    },
  },
  {
    idempotencyKey: `proteccion_refund_${paymentIntentId}`,
  }
);

    return NextResponse.json({
      ok: true,
      refundId: refund.id,
      status: refund.status,
    });
  } catch (error: any) {
    console.error("Error reembolsando protección:", error);

    return NextResponse.json(
      {
        error:
          error.message ||
          "No se pudo reembolsar el pago de protección",
      },
      { status: 500 }
    );
  }
}