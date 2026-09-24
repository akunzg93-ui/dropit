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

    // 🔐 Supabase SERVICE ROLE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // =====================================================
    // 1. Buscar pedido
    // =====================================================

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

    // =====================================================
    // 2. Validar código de entrega
    // =====================================================

    if (pedido.codigo_entrega !== codigo_entrega) {
      return NextResponse.json(
        { error: "Código de entrega incorrecto" },
        { status: 403 }
      );
    }

    // =====================================================
    // 3. Validar estado
    // =====================================================

    if (pedido.estado !== "pendiente_recoleccion") {
      return NextResponse.json(
        { error: "El pedido no está listo para entrega" },
        { status: 409 }
      );
    }

    // =====================================================
    // 4. Validar establecimiento asignado
    // =====================================================

    if (!pedido.establecimiento_uuid) {
      return NextResponse.json(
        { error: "El pedido no tiene establecimiento asignado" },
        { status: 409 }
      );
    }

    // =====================================================
    // 5. Buscar establecimiento confirmado por UUID
    // =====================================================

    const {
      data: establecimiento,
      error: establecimientoError,
    } = await supabase
      .from("establecimientos")
      .select("nombre")
      .eq("uuid", pedido.establecimiento_uuid)
      .single();

    if (establecimientoError || !establecimiento) {
      console.error(
        "❌ Error obteniendo establecimiento:",
        establecimientoError
      );

      return NextResponse.json(
        { error: "Establecimiento asignado no encontrado" },
        { status: 404 }
      );
    }

    // =====================================================
    // 6. Devolver preview
    // =====================================================

    return NextResponse.json({
      ok: true,
      pedido: {
        id: pedido.id,
        folio: pedido.folio,
        producto: pedido.producto,
        establecimiento_nombre: establecimiento.nombre,
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