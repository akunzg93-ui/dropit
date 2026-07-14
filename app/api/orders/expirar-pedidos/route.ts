import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (
      !process.env.CRON_SECRET ||
      authorization !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const limite = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("id")
      .eq("estado", "pendiente_aprobacion_establecimiento")
      .not("establecimiento_notificado_at", "is", null)
      .lt("establecimiento_notificado_at", limite);

    if (error) {
      console.error("Error buscando pedidos expirados:", error);

      return NextResponse.json(
        { error: "No se pudieron consultar los pedidos" },
        { status: 500 }
      );
    }

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({
        ok: true,
        procesados: 0,
      });
    }

    const ids = pedidos.map((pedido) => pedido.id);

    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        estado: "creado",
        establecimiento_nombre: null,
        establecimiento_uuid: null,
        establecimiento_acepto: false,
        establecimiento_notificado: false,
        establecimiento_notificado_at: null,
      })
      .in("id", ids)
      .eq("estado", "pendiente_aprobacion_establecimiento");

    if (updateError) {
      console.error("Error expirando pedidos:", updateError);

      return NextResponse.json(
        { error: "No se pudieron expirar los pedidos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      procesados: ids.length,
    });
  } catch (error) {
    console.error("Error general expirando pedidos:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}