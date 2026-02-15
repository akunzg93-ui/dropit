import { NextResponse } from "next/server";
import Stripe from "stripe";

// ❌ sin apiVersion
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ---------------------------------------------
// 💰 PRECIOS BASE
// ---------------------------------------------
const PRECIOS = {
  small: 30,
  medium: 45,
};

// ---------------------------------------------
// 🔻 DESCUENTO SEGÚN CANTIDAD
// ---------------------------------------------
function calcularDescuento(cantidadTotal) {
  if (cantidadTotal >= 50) return 0.12;
  if (cantidadTotal >= 10) return 0.10;
  return 0;
}

export async function POST(req) {
  try {
    const { items } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items inválidos" },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let cantidadTotal = 0;

    for (const item of items) {
      const { tipo, cantidad } = item;

      if (!PRECIOS[tipo] || cantidad <= 0) {
        return NextResponse.json(
          { error: "Item inválido" },
          { status: 400 }
        );
      }

      subtotal += PRECIOS[tipo] * cantidad;
      cantidadTotal += cantidad;
    }

    const descuento = calcularDescuento(cantidadTotal);
    const total = Math.round(subtotal * (1 - descuento));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: total * 100, // centavos
      currency: "mxn",
      automatic_payment_methods: { enabled: true },
      metadata: {
        subtotal: subtotal.toString(),
        descuento_porcentaje: (descuento * 100).toString(),
        cantidad_total: cantidadTotal.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      total,
      descuento: descuento * 100,
    });
  } catch (error) {
    console.error("❌ Error creando payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Error creando pago" },
      { status: 500 }
    );
  }
}
