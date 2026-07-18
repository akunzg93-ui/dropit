import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { folio, codigo_devolucion } = await req.json();

    const folioLimpio = String(folio || "").trim().toUpperCase();
    const codigoLimpio = String(codigo_devolucion || "").trim();

    if (!folioLimpio || !codigoLimpio) {
      return NextResponse.json(
        { error: "Folio y código de devolución requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        producto,
        estado,
        codigo_devolucion,
        establecimiento_uuid
      `)
      .eq("folio", folioLimpio)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (pedido.estado !== "devolucion_pendiente") {
      return NextResponse.json(
        { error: "El pedido no está pendiente de devolución" },
        { status: 409 }
      );
    }

    if (!pedido.codigo_devolucion) {
      return NextResponse.json(
        { error: "El pedido no tiene código de devolución" },
        { status: 409 }
      );
    }

    if (pedido.codigo_devolucion !== codigoLimpio) {
      return NextResponse.json(
        { error: "Código de devolución incorrecto" },
        { status: 403 }
      );
    }

    let establecimientoNombre = "—";

    if (pedido.establecimiento_uuid) {
      const { data: establecimiento } = await supabase
        .from("establecimientos")
        .select("nombre")
        .eq("uuid", pedido.establecimiento_uuid)
        .maybeSingle();

      if (establecimiento?.nombre) {
        establecimientoNombre = establecimiento.nombre;
      }
    }

    return NextResponse.json({
      ok: true,
      pedido: {
        id: pedido.id,
        folio: pedido.folio,
        producto: pedido.producto,
        establecimiento_nombre: establecimientoNombre,
      },
    });
  } catch (error) {
    console.error("Error validando devolución:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}