import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const body = await req.json();

    const balanceMovimientoIds = body?.balance_movimiento_ids;

    if (
      !Array.isArray(balanceMovimientoIds) ||
      balanceMovimientoIds.length === 0 ||
      balanceMovimientoIds.some(
        (id: unknown) =>
          !Number.isInteger(id) || Number(id) <= 0
      )
    ) {
      return NextResponse.json(
        { error: "Movimientos inválidos" },
        { status: 400 }
      );
    }

    const ids = balanceMovimientoIds.map((id: number) =>
      Number(id)
    );

    if (new Set(ids).size !== ids.length) {
      return NextResponse.json(
        { error: "No puedes seleccionar movimientos duplicados" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.rpc(
      "crear_retiro_desde_movimientos",
      {
        p_user_id: user.id,
        p_movimiento_ids: ids,
      }
    );

    if (error) {
      console.error("Error creando retiro:", error);

      const message = error.message || "";

      if (message.includes("MOVIMIENTO_NO_AUTORIZADO")) {
        return NextResponse.json(
          { error: "No tienes acceso a uno o más movimientos" },
          { status: 403 }
        );
      }

      if (message.includes("MES_NO_CERRADO")) {
        return NextResponse.json(
          {
            error:
              "Uno o más servicios todavía pertenecen al mes actual",
          },
          { status: 400 }
        );
      }

      if (message.includes("MOVIMIENTO_NO_ELEGIBLE")) {
        return NextResponse.json(
          {
            error:
              "Uno o más movimientos ya no están disponibles para retiro",
          },
          { status: 409 }
        );
      }

      if (message.includes("MOVIMIENTO_EN_RETIRO_ACTIVO")) {
        return NextResponse.json(
          {
            error:
              "Uno o más movimientos ya forman parte de otra solicitud activa",
          },
          { status: 409 }
        );
      }

      if (message.includes("MOVIMIENTO_NO_ENCONTRADO")) {
        return NextResponse.json(
          { error: "No se encontraron todos los movimientos" },
          { status: 404 }
        );
      }

      if (message.includes("DATOS_BANCARIOS_REQUIRED")) {
  return NextResponse.json(
    {
      error:
        "Registra tus datos bancarios antes de solicitar un retiro",
      code: "DATOS_BANCARIOS_REQUIRED",
    },
    { status: 400 }
  );
}

      return NextResponse.json(
        { error: "No fue posible solicitar el retiro" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      retiro_id: data?.retiro_id,
      monto: Number(data?.monto || 0),
    });
  } catch (error) {
    console.error("Error POST solicitar retiro:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}