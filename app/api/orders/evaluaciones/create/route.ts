import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type TipoEvaluador = "comprador" | "vendedor" | "establecimiento";
type TipoEvaluado = "vendedor" | "establecimiento";

export async function POST(req: Request) {
  try {
    const {
      pedido_id,
      rating,
      comentario,
      tipo_evaluador,
      tipo_evaluado,
    } = await req.json();

    const pedidoId = Number(pedido_id);
    const ratingNumero = Number(rating);

    const tiposEvaluadorValidos: TipoEvaluador[] = [
      "comprador",
      "vendedor",
      "establecimiento",
    ];

    const tiposEvaluadoValidos: TipoEvaluado[] = [
      "vendedor",
      "establecimiento",
    ];

    if (
      !Number.isInteger(pedidoId) ||
      pedidoId <= 0 ||
      !Number.isInteger(ratingNumero) ||
      ratingNumero < 1 ||
      ratingNumero > 5 ||
      !tiposEvaluadorValidos.includes(tipo_evaluador) ||
      !tiposEvaluadoValidos.includes(tipo_evaluado)
    ) {
      return NextResponse.json(
        { error: "Datos de evaluación inválidos" },
        { status: 400 }
      );
    }

    // Combinaciones permitidas
    const combinacionValida =
      (tipo_evaluador === "establecimiento" &&
        tipo_evaluado === "vendedor") ||
      (tipo_evaluador === "vendedor" &&
        tipo_evaluado === "establecimiento") ||
      (tipo_evaluador === "comprador" &&
        (tipo_evaluado === "vendedor" ||
          tipo_evaluado === "establecimiento"));

    if (!combinacionValida) {
      return NextResponse.json(
        { error: "La combinación de evaluación no es válida" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Obtener participantes reales del pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        vendedor_id,
        comprador_id,
        establecimiento_uuid
      `)
      .eq("id", pedidoId)
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

    let evaluadorId: string | null;
    let evaluadoId: string;

    // 2️⃣ Resolver automáticamente quién evalúa y quién es evaluado
    if (
      tipo_evaluador === "establecimiento" &&
      tipo_evaluado === "vendedor"
    ) {
      evaluadorId = pedido.establecimiento_uuid;
      evaluadoId = pedido.vendedor_id;
    } else if (
      tipo_evaluador === "vendedor" &&
      tipo_evaluado === "establecimiento"
    ) {
      evaluadorId = pedido.vendedor_id;
      evaluadoId = pedido.establecimiento_uuid;
    } else if (
      tipo_evaluador === "comprador" &&
      tipo_evaluado === "vendedor"
    ) {
      // comprador_id puede ser NULL porque la tabla permite
      // evaluador_id nullable para evaluaciones públicas.
      evaluadorId = pedido.comprador_id || null;
      evaluadoId = pedido.vendedor_id;
    } else {
      // comprador → establecimiento
      evaluadorId = pedido.comprador_id || null;
      evaluadoId = pedido.establecimiento_uuid;
    }

    // 3️⃣ Evitar duplicados por pedido y sentido de evaluación
    const { data: evaluacionExistente, error: consultaError } =
      await supabase
        .from("evaluaciones")
        .select("id")
        .eq("pedido_id", pedido.id)
        .eq("tipo_evaluador", tipo_evaluador)
        .eq("tipo_evaluado", tipo_evaluado)
        .limit(1)
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
        { error: "Esta evaluación ya fue registrada" },
        { status: 409 }
      );
    }

    // 4️⃣ Insertar evaluación
    const comentarioLimpio =
      typeof comentario === "string" && comentario.trim()
        ? comentario.trim()
        : null;

    const { error: insertError } = await supabase
      .from("evaluaciones")
      .insert({
        pedido_id: pedido.id,
        evaluador_id: evaluadorId,
        evaluado_id: evaluadoId,
        tipo_evaluador,
        tipo_evaluado,
        rating: ratingNumero,
        comentario: comentarioLimpio,
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