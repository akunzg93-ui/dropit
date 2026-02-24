import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { folio, codigo_entrega } = await req.json();

    console.log("🔵 PREVIEW body:", { folio, codigo_entrega });

    if (!folio || !codigo_entrega) {
      return NextResponse.json(
        { error: "Folio y código requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        codigo_entrega,
        producto
      `)
      .eq("folio", folio)
      .single();

    console.log("🔵 PREVIEW pedido:", pedido, error);

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (pedido.codigo_entrega !== codigo_entrega) {
      return NextResponse.json(
        { error: "Código de entrega incorrecto" },
        { status: 403 }
      );
    }

    // 🔧 CAMBIO CLAVE: ahora validamos pendiente_recoleccion
    if (pedido.estado !== "pendiente_recoleccion") {
      return NextResponse.json(
        { error: "El pedido no está listo para entrega" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      pedido: {
        id: pedido.id,
        folio: pedido.folio,
        producto: pedido.producto,
        establecimiento_nombre: "—",
      },
    });
  } catch (err) {
    console.error("❌ ERROR PREVIEW:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
