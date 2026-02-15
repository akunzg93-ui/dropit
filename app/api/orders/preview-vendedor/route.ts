console.log("🔥 API /orders/preview-vendor CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  console.log("➡️ POST /api/orders/preview-vendor");

  try {
    const { folio, codigo_vendedor } = await req.json();

    if (!folio || !codigo_vendedor) {
      return NextResponse.json(
        { error: "folio y codigo_vendedor requeridos" },
        { status: 400 }
      );
    }

    // 🔐 Supabase SERVICE ROLE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Buscar pedido
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        producto,
        tamano,
        codigo_vendedor,
        pedido_establecimientos (
          establecimientos (
            id,
            nombre,
            direccion
          )
        )
      `)
      .eq("folio", folio)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 2️⃣ VALIDACIÓN CLAVE (🔴 AQUÍ ESTABA EL ERROR)
    if (pedido.estado !== "en_transito") {
      return NextResponse.json(
        { error: "El pedido no está en estado válido para recepción" },
        { status: 409 }
      );
    }

    // 3️⃣ Validar código del vendedor
    if (pedido.codigo_vendedor !== codigo_vendedor) {
      return NextResponse.json(
        { error: "Código de vendedor incorrecto" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      pedido,
    });
  } catch (err) {
    console.error("❌ ERROR PREVIEW VENDOR:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
