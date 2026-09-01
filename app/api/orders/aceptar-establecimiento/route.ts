import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function generarCodigo() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}

export async function POST(req: Request) {
  try {
    // =====================================================
    // 1. Validar autenticación
    // =====================================================

    const authHeader =
      req.headers.get("authorization");

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    // =====================================================
    // 2. Validar request
    // =====================================================

    const { pedido_id } = await req.json();

    if (!pedido_id) {
      return NextResponse.json(
        { error: "pedido_id requerido" },
        { status: 400 }
      );
    }

    // =====================================================
    // 3. Obtener pedido
    // =====================================================

    const {
      data: pedido,
      error: pedidoError,
    } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        codigo_vendedor,
        establecimiento_uuid
      `)
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (!pedido.establecimiento_uuid) {
      return NextResponse.json(
        {
          error:
            "El pedido no tiene establecimiento asignado",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // 4. Verificar propietario del establecimiento
    // =====================================================

    const {
      data: establecimiento,
      error: establecimientoError,
    } = await supabase
      .from("establecimientos")
      .select(`
        uuid,
        usuario_id
      `)
      .eq(
        "uuid",
        pedido.establecimiento_uuid
      )
      .single();

    if (
      establecimientoError ||
      !establecimiento
    ) {
      return NextResponse.json(
        {
          error:
            "Establecimiento no encontrado",
        },
        { status: 404 }
      );
    }

    if (
      establecimiento.usuario_id !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para aceptar este pedido",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // 5. Validar estado
    // =====================================================

    if (
      pedido.estado !==
      "pendiente_aprobacion_establecimiento"
    ) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // =====================================================
    // 6. Generar código si no existe
    // =====================================================

    const codigo =
      pedido.codigo_vendedor ||
      generarCodigo();

    // =====================================================
    // 7. Aceptar pedido
    // =====================================================

    const { error: updateError } =
      await supabase
        .from("pedidos")
        .update({
          estado: "en_transito",
          establecimiento_acepto: true,
          establecimiento_aceptado_at:
            new Date().toISOString(),
          codigo_vendedor: codigo,
        })
        .eq("id", pedido.id)
        .eq(
          "estado",
          "pendiente_aprobacion_establecimiento"
        );

    if (updateError) {
      console.error(
        "Error actualizando pedido:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Error actualizando pedido",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 8. Notificar vendedor
    // =====================================================

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        "http://localhost:3000";

      const notifyRes = await fetch(
        `${baseUrl}/api/orders/notificar-vendedor`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            folio: pedido.folio,
          }),
        }
      );

      if (!notifyRes.ok) {
        const notifyText =
          await notifyRes.text();

        console.error(
          "Error notificando vendedor:",
          notifyRes.status,
          notifyText
        );
      }
    } catch (error) {
      console.error(
        "Error notificando vendedor:",
        error
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Error general aceptando pedido:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}