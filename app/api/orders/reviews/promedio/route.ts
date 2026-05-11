import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const evaluado_id = searchParams.get("evaluado_id");
    const tipo = searchParams.get("tipo");

    if (!evaluado_id || !tipo) {
      return NextResponse.json(
        { error: "faltan parámetros" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("evaluaciones")
      .select("rating")
      .eq("evaluado_id", evaluado_id)
      .eq("tipo_evaluado", tipo);

    if (error) {
      console.error("ERROR SUPABASE:", error);

      return NextResponse.json(
        { error: "error consultando evaluaciones" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        promedio: 0,
        total: 0,
      });
    }

    const total = data.length;

    const suma = data.reduce(
      (acc, item) => acc + Number(item.rating || 0),
      0
    );

    const promedio = Number((suma / total).toFixed(1));

    return NextResponse.json({
      promedio,
      total,
    });

  } catch (err) {
    console.error("ERROR GENERAL:", err);

    return NextResponse.json(
      { error: "error interno" },
      { status: 500 }
    );
  }
}