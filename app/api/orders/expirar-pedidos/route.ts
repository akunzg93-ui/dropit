import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Buscar pedidos vencidos (1 día)
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("id")
      .eq("estado", "pendiente_aprobacion_establecimiento")
      .lt(
        "establecimiento_notificado_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({ ok: true, procesados: 0 });
    }

    // 2️⃣ Resetear pedidos
    const ids = pedidos.map((p) => p.id);

    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        estado: "creado",
        establecimiento_nombre: null,
        establecimiento_uuid: null,
        establecimiento_acepto: false,
      })
      .in("id", ids);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, procesados: ids.length });

  } catch (err) {
    console.error("Error expirando pedidos:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}