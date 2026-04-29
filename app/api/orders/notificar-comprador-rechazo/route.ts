import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { pedido_id } = await req.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pedido } = await supabase
      .from("pedidos")
      .select("email_comprador, folio")
      .eq("id", pedido_id)
      .single();

    if (!pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    // 🔔 ENVÍO DE CORREO (usa tu sistema actual)
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: pedido.email_comprador,
        subject: "Debes elegir otro establecimiento",
        html: `
          <h2>Tu pedido necesita atención</h2>
          <p>El establecimiento seleccionado no pudo recibir tu paquete.</p>
          <p>Por favor entra a la plataforma y elige otro establecimiento.</p>
          <p><strong>Folio:</strong> ${pedido.folio}</p>
        `,
      }),
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}