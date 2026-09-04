import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { retiro_id, status, referencia_pago } = await req.json();

    if (!retiro_id || !status) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    const statusNormalized = String(status).toLowerCase().trim();

    const estadosPermitidos = ["approved", "reversed", "paid"];

    if (!estadosPermitidos.includes(statusNormalized)) {
      return NextResponse.json(
        { error: "Estado solicitado inválido" },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // AUTH
    // ─────────────────────────────────────────────

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

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

    // ─────────────────────────────────────────────
    // VALIDAR ADMIN
    // ─────────────────────────────────────────────

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "No tienes permisos de administrador" },
        { status: 403 }
      );
    }

    // ─────────────────────────────────────────────
    // OBTENER RETIRO
    // ─────────────────────────────────────────────

    const { data: retiro, error: retiroError } = await supabase
      .from("retiros")
      .select(`
        id,
        monto,
        status,
        referencia_pago,
        approved_at,
        paid_at
      `)
      .eq("id", retiro_id)
      .single();

    if (retiroError || !retiro) {
      return NextResponse.json(
        { error: "Retiro no encontrado" },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────
    // IDEMPOTENCIA
    // ─────────────────────────────────────────────

    if (statusNormalized === retiro.status) {
      return NextResponse.json({
        ok: true,
        status: retiro.status,
      });
    }

    // ─────────────────────────────────────────────
    // TRANSICIONES PERMITIDAS
    // ─────────────────────────────────────────────

    const transicionValida =
      (retiro.status === "pending" &&
        (statusNormalized === "approved" ||
          statusNormalized === "reversed")) ||
      (retiro.status === "approved" &&
        statusNormalized === "paid");

    if (!transicionValida) {
      return NextResponse.json(
        {
          error: `No se puede cambiar un retiro de ${retiro.status} a ${statusNormalized}`,
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // APROBAR
    // ─────────────────────────────────────────────

    if (statusNormalized === "approved") {
      const { error: updateError } = await supabase
        .from("retiros")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", retiro_id)
        .eq("status", "pending");

      if (updateError) throw updateError;

      return NextResponse.json({
        ok: true,
        status: "approved",
      });
    }

    // ─────────────────────────────────────────────
    // RECHAZAR
    // ─────────────────────────────────────────────

    if (statusNormalized === "reversed") {
      const { error: updateError } = await supabase
        .from("retiros")
        .update({
          status: "reversed",
        })
        .eq("id", retiro_id)
        .eq("status", "pending");

      if (updateError) throw updateError;

      /*
        IMPORTANTE:

        NO eliminamos retiro_aplicaciones.

        El retiro queda como histórico.

        Cuando la página/API calcule movimientos disponibles,
        ignorará aplicaciones pertenecientes a retiros reversed.

        Por lo tanto esos pedidos podrán volver a seleccionarse.
      */

      return NextResponse.json({
        ok: true,
        status: "reversed",
      });
    }

    // ─────────────────────────────────────────────
    // PAGAR
    // ─────────────────────────────────────────────

    if (statusNormalized === "paid") {
      const { data: aplicaciones, error: aplicacionesError } =
        await supabase
          .from("retiro_aplicaciones")
          .select(`
            balance_movimiento_id,
            monto_aplicado
          `)
          .eq("retiro_id", retiro_id);

      if (aplicacionesError) throw aplicacionesError;

      if (!aplicaciones || aplicaciones.length === 0) {
        return NextResponse.json(
          {
            error:
              "El retiro no tiene movimientos asociados",
          },
          { status: 400 }
        );
      }

      // Verificación defensiva:
      // el detalle debe sumar exactamente el monto del retiro.

      const totalAplicado = aplicaciones.reduce(
        (acc, app) => acc + Number(app.monto_aplicado),
        0
      );

      const totalAplicadoRedondeado = Number(
        totalAplicado.toFixed(2)
      );

      const montoRetiro = Number(
        Number(retiro.monto).toFixed(2)
      );

      if (totalAplicadoRedondeado !== montoRetiro) {
        return NextResponse.json(
          {
            error:
              "El detalle del retiro no coincide con el monto autorizado",
          },
          { status: 409 }
        );
      }

      const movimientoIds = aplicaciones.map(
        (app) => app.balance_movimiento_id
      );

      // Obtener los movimientos exactos.
      const { data: movimientos, error: movimientosError } =
        await supabase
          .from("balance_movimientos")
          .select(`
            id,
            status
          `)
          .in("id", movimientoIds);

      if (movimientosError) throw movimientosError;

      if (!movimientos || movimientos.length !== movimientoIds.length) {
        return NextResponse.json(
          {
            error:
              "No fue posible validar todos los movimientos del retiro",
          },
          { status: 409 }
        );
      }

      const movimientoInvalido = movimientos.find(
        (mov) =>
          mov.status === "paid" ||
          mov.status === "reversed"
      );

      if (movimientoInvalido) {
        return NextResponse.json(
          {
            error:
              "Uno de los movimientos del retiro ya fue pagado o reversado",
          },
          { status: 409 }
        );
      }

      const fechaPago = new Date().toISOString();

      // Marcar EXCLUSIVAMENTE los movimientos seleccionados.
      const { error: movimientosUpdateError } = await supabase
        .from("balance_movimientos")
        .update({
          status: "paid",
          fecha_pago: fechaPago,
          referencia_pago: referencia_pago || null,
        })
        .in("id", movimientoIds);

      if (movimientosUpdateError) {
        throw movimientosUpdateError;
      }

      // Finalmente marcar retiro pagado.
      const { error: retiroUpdateError } = await supabase
        .from("retiros")
        .update({
          status: "paid",
          referencia_pago: referencia_pago || null,
          paid_at: fechaPago,
          fecha_pago: fechaPago,
        })
        .eq("id", retiro_id)
        .eq("status", "approved");

      if (retiroUpdateError) {
        throw retiroUpdateError;
      }

      return NextResponse.json({
        ok: true,
        status: "paid",
        movimientos_pagados: movimientoIds.length,
        monto: montoRetiro,
      });
    }

    return NextResponse.json(
      { error: "Operación no válida" },
      { status: 400 }
    );
  } catch (e: any) {
    console.error("ERROR RETIRO:", e);

    return NextResponse.json(
      {
        error: e?.message || "Error interno",
      },
      { status: 500 }
    );
  }
}