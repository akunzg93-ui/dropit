import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 2️⃣ Validar estado
    if (pedido.estado !== "pendiente_aprobacion_establecimiento") {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // 3️⃣ Generar código si no existe
    let codigo = pedido.codigo_vendedor;

    if (!codigo) {
      codigo = generarCodigo();
    }

    // 4️⃣ Update pedido
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        estado: "en_transito",
        establecimiento_acepto: true,
        codigo_vendedor: codigo,
      })
      .eq("id", pedido_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Error actualizando pedido" },
        { status: 500 }
      );
    }

    // 5️⃣ 🔔 Notificar vendedor (AQUÍ ESTÁ LA CLAVE)
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/orders/notificar-vendedor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pedido_id }),
        }
      );
    } catch (err) {
      console.error("Error notificando vendedor:", err);
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