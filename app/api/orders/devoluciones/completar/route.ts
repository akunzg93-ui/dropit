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
        estado,
        email_vendedor
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

    const { data: pedidoId, error: completeError } = await supabase.rpc(
      "complete_order_return",
      {
        p_folio: folioLimpio,
        p_codigo_devolucion: codigoLimpio,
      }
    );

    if (completeError) {
      console.error(
        `Error completando devolución del pedido ${pedido.id}:`,
        completeError
      );

      const mensaje = completeError.message || "No se pudo completar la devolución";

      let status = 409;

      if (mensaje.includes("incorrecto")) {
        status = 403;
      }

      if (mensaje.includes("no encontrado")) {
        status = 404;
      }

      return NextResponse.json(
        { error: mensaje },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      pedido_id: pedidoId,
      estado: "devuelto",
    });
  } catch (error) {
    console.error("Error general completando devolución:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}