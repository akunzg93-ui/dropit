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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const statusNormalized = String(status).toLowerCase().trim();

    // 🔍 obtener retiro
    const { data: retiro, error: retiroError } = await supabase
      .from("retiros")
      .select("*")
      .eq("id", retiro_id)
      .single();

    if (retiroError || !retiro) {
      return NextResponse.json(
        { error: "Retiro no encontrado" },
        { status: 404 }
      );
    }

    // 🔒 validación
    if (
      statusNormalized === "paid" &&
      retiro.status !== "approved" &&
      retiro.status !== "pending"
    ) {
      return NextResponse.json(
        { error: "Estado inválido para pago" },
        { status: 400 }
      );
    }

    // 🔹 update retiro
    const { data: updatedRetiro, error: updateError } = await supabase
      .from("retiros")
      .update({
        status: statusNormalized,
        ...(statusNormalized === "paid" && {
          referencia_pago: referencia_pago || null,
        }),
      })
      .eq("id", retiro_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 🔥 NUEVO: obtener detalles
    const { data: detalles, error: detallesError } = await supabase
      .from("retiro_detalles")
      .select("*")
      .eq("retiro_id", retiro_id);

    if (detallesError) throw detallesError;

    // 🔥 CONTABILIDAD MULTI-ESTABLECIMIENTO
    if (statusNormalized === "paid") {
      for (const det of detalles || []) {
        let montoRestante = Number(Number(det.monto).toFixed(2));

        const { data: movimientos, error: movError } = await supabase
          .from("balance_movimientos")
          .select("*")
          .eq("establecimiento_id", det.establecimiento_id)
          .eq("status", "available")
          .order("created_at", { ascending: true });

        if (movError) throw movError;

        for (const mov of movimientos || []) {
          if (montoRestante <= 0) break;

          const montoMov = parseFloat(mov.neto_establecimiento || 0);

          if (montoMov <= montoRestante) {
            const { error: updError } = await supabase
              .from("balance_movimientos")
              .update({ status: "paid" })
              .eq("id", mov.id);

            if (updError) throw updError;

            const { error: appError } = await supabase
              .from("retiro_aplicaciones")
              .insert({
                retiro_id,
                balance_movimiento_id: mov.id,
                monto_aplicado: montoMov,
              });

            if (appError) throw appError;

            montoRestante -= montoMov;
          } else {
            const restante = montoMov - montoRestante;

            const { error: updError } = await supabase
              .from("balance_movimientos")
              .update({ status: "paid" })
              .eq("id", mov.id);

            if (updError) throw updError;

            const { error: insertError } = await supabase
              .from("balance_movimientos")
              .insert({
                pedido_id: mov.pedido_id,
                establecimiento_id: mov.establecimiento_id,
                moneda: mov.moneda,
                monto_bruto: mov.monto_bruto,
                comision_rate: mov.comision_rate,
                iva_rate: mov.iva_rate,
                comision_monto: mov.comision_monto,
                iva_monto: mov.iva_monto,
                neto_establecimiento: Number(restante.toFixed(2)),
                status: "available",
              });

            if (insertError) throw insertError;

            const { error: appError } = await supabase
              .from("retiro_aplicaciones")
              .insert({
                retiro_id,
                balance_movimiento_id: mov.id,
                monto_aplicado: montoRestante,
              });

            if (appError) throw appError;

            montoRestante = 0;
          }
        }
      }
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("ERROR RETIRO:", e);
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}