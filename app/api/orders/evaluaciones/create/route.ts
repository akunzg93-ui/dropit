import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const {
      pedido_id,
      rating,
      comentario,
      tipo_evaluador,
      tipo_evaluado,
    } = await req.json();

    const ratingNumero = Number(rating);

    if (
      !pedido_id ||
      !Number.isInteger(ratingNumero) ||
      ratingNumero < 1 ||
      ratingNumero > 5
    ) {
      return NextResponse.json(
        { error: "Pedido y calificación válida son obligatorios" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Obtener los UUID reales relacionados con el pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        vendedor_id,
        establecimiento_uuid
      `)
      .eq("id", pedido_id)
      .single();

    if (pedidoError || !pedido) {
      console.error("❌ Error consultando pedido:", pedidoError);

      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (!pedido.vendedor_id) {
      return NextResponse.json(
        { error: "El pedido no tiene vendedor asociado" },
        { status: 400 }
      );
    }

    if (!pedido.establecimiento_uuid) {
      return NextResponse.json(
        { error: "El pedido no tiene establecimiento asociado" },
        { status: 400 }
      );
    }

    const evaluadorId = pedido.establecimiento_uuid;
    const evaluadoId = pedido.vendedor_id;

    // 2️⃣ Evitar evaluación duplicada
    const { data: evaluacionExistente, error: consultaError } =
      await supabase
        .from("evaluaciones")
        .select("id")
        .eq("pedido_id", pedido.id)
        .eq("evaluador_id", evaluadorId)
        .eq("evaluado_id", evaluadoId)
        .maybeSingle();

    if (consultaError) {
      console.error(
        "❌ Error verificando evaluación existente:",
        consultaError
      );

      return NextResponse.json(
        { error: "No se pudo validar la evaluación" },
        { status: 500 }
      );
    }

    if (evaluacionExistente) {
      return NextResponse.json(
        { error: "Este pedido ya fue evaluado" },
        { status: 409 }
      );
    }

    // 3️⃣ Insertar evaluación
    const { error: insertError } = await supabase
      .from("evaluaciones")
      .insert({
        pedido_id: pedido.id,
        evaluador_id: evaluadorId,
        evaluado_id: evaluadoId,
        rating: ratingNumero,
        comentario: comentario?.trim() || null,
        tipo_evaluador:
          tipo_evaluador || "establecimiento",
        tipo_evaluado:
          tipo_evaluado || "vendedor",
      });

    if (insertError) {
      console.error("❌ Error insertando evaluación:", insertError);

      return NextResponse.json(
        {
          error: "Error insertando evaluación",
          detail: insertError.message,
          code: insertError.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Evaluación registrada correctamente",
    });
  } catch (error) {
    console.error("❌ Error interno en evaluación:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}