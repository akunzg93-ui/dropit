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

    const retiroId = body?.retiro_id;
    const status = body?.status;
    const referenciaPago = body?.referencia_pago ?? null;

    if (!retiroId || typeof retiroId !== "string") {
      return NextResponse.json(
        { error: "Retiro inválido" },
        { status: 400 }
      );
    }

    if (
      !["approved", "reversed", "paid"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Estado inválido" },
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
      "actualizar_retiro_admin",
      {
        p_admin_user_id: user.id,
        p_retiro_id: retiroId,
        p_status: status,
        p_referencia_pago:
          typeof referenciaPago === "string"
            ? referenciaPago
            : null,
      }
    );

    if (error) {
      console.error("Error actualizando retiro:", error);

      const message = error.message || "";

      if (
        message.includes("NO_AUTORIZADO") ||
        message.includes("ADMIN_REQUIRED")
      ) {
        return NextResponse.json(
          { error: "No autorizado" },
          { status: 403 }
        );
      }

      if (message.includes("RETIRO_NO_ENCONTRADO")) {
        return NextResponse.json(
          { error: "Retiro no encontrado" },
          { status: 404 }
        );
      }

      if (message.includes("TRANSICION_INVALIDA")) {
        return NextResponse.json(
          {
            error:
              "El retiro ya no se encuentra en un estado válido para esta acción",
          },
          { status: 409 }
        );
      }

      if (message.includes("RETIRO_SIN_APLICACIONES")) {
        return NextResponse.json(
          {
            error:
              "La solicitud no contiene movimientos financieros",
          },
          { status: 409 }
        );
      }

      if (
        message.includes("MONTO_NO_COINCIDE") ||
        message.includes("MOVIMIENTOS_INCOMPLETOS")
      ) {
        return NextResponse.json(
          {
            error:
              "La solicitud tiene una inconsistencia financiera",
          },
          { status: 409 }
        );
      }

      if (message.includes("MOVIMIENTO_NO_ELEGIBLE")) {
        return NextResponse.json(
          {
            error:
              "Uno o más movimientos ya no pueden ser pagados",
          },
          { status: 409 }
        );
      }

if (message.includes("REFERENCIA_PAGO_REQUIRED")) {
  return NextResponse.json(
    { error: "La referencia de pago es obligatoria" },
    { status: 400 }
  );
}

      return NextResponse.json(
        { error: "No fue posible actualizar el retiro" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      retiro: data,
    });
  } catch (error) {
    console.error("Error POST actualizar retiro:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}