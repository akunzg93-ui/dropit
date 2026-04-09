import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { establecimiento_id } = await req.json();

    if (!establecimiento_id) {
      return NextResponse.json({ error: "Falta establecimiento_id" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 🔹 INGRESOS (solo originales)
    const { data: ingresos } = await supabase
      .from("balance_movimientos")
      .select("neto_establecimiento, created_at, status")
      .eq("establecimiento_id", establecimiento_id)
      .eq("status", "paid");

    // 🔹 RETIROS (raw)
    const { data: retiros } = await supabase
      .from("retiro_aplicaciones")
      .select(`
        monto_aplicado,
        created_at,
        balance_movimientos (
          establecimiento_id
        )
      `);

    // 🔥 filtrar en JS (seguro)
    const retirosFiltrados = (retiros || []).filter(
      (r: any) =>
        r.balance_movimientos?.establecimiento_id === establecimiento_id
    );

    // 🔹 normalizar
    const movimientos = [
      ...(ingresos || []).map((i) => ({
        tipo: "ingreso",
        monto: i.neto_establecimiento,
        fecha: i.created_at,
      })),
      ...retirosFiltrados.map((r: any) => ({
        tipo: "retiro",
        monto: r.monto_aplicado,
        fecha: r.created_at,
      })),
    ];

    movimientos.sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );

    return NextResponse.json({ movimientos });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}