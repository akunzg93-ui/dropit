import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validar usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { pedido_id } = await req.json();

    if (!pedido_id) {
      return NextResponse.json(
        { error: "pedido_id requerido" },
        { status: 400 }
      );
    }

    // 2. Obtener pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("id, estado, establecimiento_uuid")
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // Idempotencia
    if (pedido.estado !== "pendiente_aprobacion_establecimiento") {
      return NextResponse.json({ ok: true });
    }

    if (!pedido.establecimiento_uuid) {
      return NextResponse.json(
        { error: "Pedido sin establecimiento asignado" },
        { status: 400 }
      );
    }

    // 3. Verificar que el establecimiento pertenece al usuario
    const {
      data: establecimiento,
      error: establecimientoError,
    } = await supabase
      .from("establecimientos")
      .select("id")
      .eq("uuid", pedido.establecimiento_uuid)
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (establecimientoError || !establecimiento) {
      return NextResponse.json(
        { error: "No tienes autorización para rechazar este pedido" },
        { status: 403 }
      );
    }

    // 4. Rechazar + liberar capacidad
    const { error: rejectError } = await supabase.rpc(
      "rechazar_establecimiento_pedido",
      {
        p_pedido_id: Number(pedido_id),
      }
    );

    if (rejectError) {
      console.error("Error rechazando pedido:", rejectError);

      return NextResponse.json(
        {
          error:
            rejectError.message ||
            "Error rechazando pedido",
        },
        { status: 400 }
      );
    }

    // 5. Notificar comprador
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