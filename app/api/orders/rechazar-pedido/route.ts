import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { pedido_id } = await req.json();

    if (!pedido_id) {
      return NextResponse.json(
        { error: "pedido_id requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Obtener pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 🔴 NUEVO (FASE 7 - evitar doble ejecución)
    if (pedido.estado !== "pendiente_aprobacion_establecimiento") {
      return NextResponse.json({ ok: true });
    }

    // 2️⃣ Regresar a creado
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        estado: "creado",
        establecimiento_nombre: null,
        establecimiento_uuid: null,
        establecimiento_acepto: false,
      })
      .eq("id", pedido_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Error actualizando pedido" },
        { status: 500 }
      );
    }

    // 3️⃣ Notificar comprador
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/notificar-comprador-rechazo`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pedido_id }),
        }
      );
    } catch (err) {
      console.error("Error notificando comprador:", err);
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("Error general:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}