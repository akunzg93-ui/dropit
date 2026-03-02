import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { folio, codigo_entrega } = await req.json();

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

    // 1️⃣ Traer pedido
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        codigo_entrega,
        producto,
        establecimiento_uuid
      `)
      .eq("folio", folio)
      .single();

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

    if (pedido.estado !== "pendiente_recoleccion") {
      return NextResponse.json(
        { error: "El pedido no está listo para entrega" },
        { status: 409 }
      );
    }

    // 2️⃣ Buscar establecimiento por ID (NO por uuid)
    let establecimientoNombre = "—";

    if (pedido.establecimiento_uuid) {
      const { data: est } = await supabase
        .from("establecimientos")
        .select("nombre")
        .eq("id", pedido.establecimiento_uuid)
        .single();

      if (est?.nombre) {
        establecimientoNombre = est.nombre;
      }
    }

    return NextResponse.json({
      pedido: {
        id: pedido.id,
        folio: pedido.folio,
        producto: pedido.producto,
        establecimiento_nombre: establecimientoNombre,
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