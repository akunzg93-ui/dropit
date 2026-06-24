import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function toNumber(value, fallback = 0) {
  return Number(String(value || fallback).replace(",", "."));
}

export async function POST(req) {
  try {
    const { valorDeclarado } = await req.json();
    const valor = toNumber(valorDeclarado);

    const { data, error } = await supabaseAdmin
      .from("dropit_config")
      .select("clave, valor")
      .in("clave", [
        "proteccion_enabled",
        "proteccion_porcentaje",
        "proteccion_valor_minimo",
        "proteccion_valor_maximo",
      ]);

    if (error) throw error;

    const cfg = {};
    data?.forEach((item) => {
      cfg[item.clave] = item.valor;
    });

    const enabled = cfg.proteccion_enabled === "true";
    const porcentaje = toNumber(cfg.proteccion_porcentaje, 2);
    const valorMinimo = toNumber(cfg.proteccion_valor_minimo, 500);
    const valorMaximo = toNumber(cfg.proteccion_valor_maximo, 15000);

    if (!enabled) {
      return NextResponse.json(
        { error: "Protección no disponible" },
        { status: 400 }
      );
    }

    if (!valor || valor < valorMinimo) {
      return NextResponse.json(
        { error: `El valor mínimo asegurable es $${valorMinimo} MXN` },
        { status: 400 }
      );
    }

    if (valor > valorMaximo) {
      return NextResponse.json(
        { error: `El valor máximo asegurable es $${valorMaximo} MXN` },
        { status: 400 }
      );
    }

    const montoProteccion = Number(((valor * porcentaje) / 100).toFixed(2));

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(montoProteccion * 100),
      currency: "mxn",
      automatic_payment_methods: { enabled: true },
      metadata: {
        producto: "proteccion_dropit",
        valor_declarado: valor.toString(),
        porcentaje: porcentaje.toString(),
        monto_proteccion: montoProteccion.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      montoProteccion,
      porcentaje,
      valorDeclarado: valor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Error creando pago de protección" },
      { status: 500 }
    );
  }
}