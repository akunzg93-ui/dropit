console.log("🔥 API /orders/confirmado CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  console.log("➡️ POST /api/orders/confirmado");

  try {
    let { pedido_id, establecimiento_id } = await req.json();

    pedido_id = Number(pedido_id);
    establecimiento_id = Number(establecimiento_id);

    if (!pedido_id || !establecimiento_id) {
      return NextResponse.json(
        { error: "pedido_id y establecimiento_id requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Pedido
    const { data: pedido } = await supabase
      .from("pedidos")
      .select("id")
      .eq("id", pedido_id)
      .single();

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 2️⃣ Establecimiento (AHORA traemos uuid también)
    const { data: establecimiento } = await supabase
      .from("establecimientos")
      .select("id, nombre, uuid")
      .eq("id", establecimiento_id)
      .single();

    if (!establecimiento) {
      return NextResponse.json(
        { error: "Establecimiento no encontrado" },
        { status: 404 }
      );
    }

    // 3️⃣ Update pedido (ESTADO + ESTABLECIMIENTO + UUID)
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        estado: "en_transito",
        establecimiento_nombre: establecimiento.nombre,
        establecimiento_uuid: establecimiento.uuid, // 🔥 CLAVE
      })
      .eq("id", pedido_id);

    if (updateError) {
      console.error("❌ UPDATE ERROR:", updateError);
      return NextResponse.json(
        { error: "No se pudo actualizar el pedido" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ ERROR CONFIRMADO:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}