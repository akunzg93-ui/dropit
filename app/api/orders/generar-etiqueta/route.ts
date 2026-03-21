import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folio = searchParams.get("folio");

    if (!folio) {
      return NextResponse.json({ error: "folio requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("folio, codigo_vendedor")
      .eq("folio", folio)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    // 🔥 LLAMADA AL MICRO SERVICIO
    const response = await fetch("http://localhost:4000/generar-etiqueta", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        folio: pedido.folio,
        codigo_vendedor: pedido.codigo_vendedor,
      }),
    });

    if (!response.ok) {
      throw new Error("Error en microservicio PDF");
    }

    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Error generando etiqueta", detalle: String(err) },
      { status: 500 }
    );
  }
}