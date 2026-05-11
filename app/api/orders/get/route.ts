import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { pedido_id } = await req.json();

    if (!pedido_id) {
      return NextResponse.json(
        { error: "pedido_id requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        vendedor_id,
        establecimiento_uuid
      `)
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(pedido);

  } catch (err) {
    console.error("❌ ERROR GET PEDIDO:", err);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}