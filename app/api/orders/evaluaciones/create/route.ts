import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto"; // 🔥 IMPORTANTE

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let {
      pedido_id,
      evaluador_id,
      evaluado_id,
      rating,
      comentario,
      tipo_evaluador,
      tipo_evaluado,
    } = body;

    // 🔥 FIX REAL: SIEMPRE UUID válido
    if (!evaluador_id) {
      evaluador_id = randomUUID();
    }

    // 🔥 VALIDACIÓN
    if (!pedido_id || !evaluador_id || !evaluado_id || !rating) {
      return NextResponse.json(
        { error: "faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("INSERTANDO:", {
      pedido_id,
      evaluador_id,
      tipo_evaluador,
      tipo_evaluado,
    });

    const { error } = await supabase.from("evaluaciones").insert({
      pedido_id,
      evaluador_id,
      evaluado_id,
      rating,
      comentario: comentario || null,
      tipo_evaluador,
      tipo_evaluado,
    });

   if (error) {
  console.error("❌ ERROR DB:", error);

  return NextResponse.json(
    {
      error: "error insertando evaluación",
      detail: error.message,
      code: error.code,
      full: error,
    },
    { status: 500 }
  );
}

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("❌ ERROR SERVER:", err);
    return NextResponse.json(
      { error: "error interno" },
      { status: 500 }
    );
  }
}