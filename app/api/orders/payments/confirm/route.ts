import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// ✅ Stripe SIN apiVersion
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { payment_intent_id } = await req.json();

    if (!payment_intent_id) {
      return NextResponse.json(
        { error: "payment_intent_id requerido" },
        { status: 400 }
      );
    }

    // 1️⃣ Verificar pago en Stripe
    const intent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (intent.status !== "succeeded") {
      return NextResponse.json(
        { error: "El pago no está confirmado" },
        { status: 400 }
      );
    }

    // 2️⃣ Leer items desde metadata
    const items = intent.metadata?.items
      ? JSON.parse(intent.metadata.items)
      : [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No hay coins para acreditar" },
        { status: 400 }
      );
    }

    // 3️⃣ Supabase (service role)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ⚠️ MVP: tomamos el primer usuario autenticado
    const { data: users, error: usersError } =
      await supabase.auth.admin.listUsers();

    if (usersError || !users?.users?.length) {
      throw new Error("No se pudo obtener el usuario");
    }

    const userId = users.users[0].id;

    // 4️⃣ Insertar coins
    const rows = items.map((item: any) => ({
      user_id: userId,
      tipo: item.tipo, // "small" | "medium"
      estado: "activa",
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      payment_intent_id,
    }));

    const { error: insertError } = await supabase
      .from("coins")
      .insert(rows);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      ok: true,
      message: "Coins acreditadas correctamente",
    });
  } catch (err: any) {
    console.error("❌ confirm error:", err);
    return NextResponse.json(
      { error: err.message || "Error interno" },
      { status: 500 }
    );
  }
}
