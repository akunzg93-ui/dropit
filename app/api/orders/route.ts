import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { consumeCoin } from "@/lib/coins";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 🔎 Validación mínima
    if (
      !body.comprador_id ||
      !body.establecimiento_id ||
      !body.size
    ) {
      return NextResponse.json(
        { error: "Datos incompletos para crear el pedido" },
        { status: 400 }
      );
    }

    if (!["small", "medium"].includes(body.size)) {
      return NextResponse.json(
        { error: "Tamaño de pedido inválido" },
        { status: 400 }
      );
    }

    // 🔐 Cliente normal (para auth)
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const vendorId = user.id;

    // 🔐 Cliente ADMIN (service role)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Crear pedido
    const { data: pedido, error: pedidoError } = await supabaseAdmin
      .from("pedidos")
      .insert({
        comprador_id: body.comprador_id,
        establecimiento_id: body.establecimiento_id,
        establecimiento_nombre: body.establecimiento_nombre ?? null,
        lat: body.lat ?? null,
        lng: body.lng ?? null,
        size: body.size, // 👈 small | medium
        estado: "pendiente_confirmacion",
      })
      .select()
      .single();

    if (pedidoError) {
      console.error("❌ Error al crear pedido:", pedidoError);

      return NextResponse.json(
        {
          error: pedidoError.message,
          hint: "Verifica capacidad del establecimiento o políticas RLS",
        },
        { status: 400 }
      );
    }

    // 2️⃣ Consumir coin del vendedor
    try {
      await consumeCoin({
        vendorId,
        size: body.size,
        orderId: pedido.id,
      });
    } catch (coinError: any) {
      console.error("🪙 Error al consumir coin:", coinError.message);

      // 🔄 Rollback del pedido
      await supabaseAdmin
        .from("pedidos")
        .delete()
        .eq("id", pedido.id);

      return NextResponse.json(
        { error: coinError.message },
        { status: 400 }
      );
    }

    // 3️⃣ OK
    return NextResponse.json(
      {
        success: true,
        data: pedido,
        message: "Pedido creado y coin descontada correctamente",
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("🔥 Error inesperado en servidor:", e);

    return NextResponse.json(
      {
        error: "Error en el servidor al crear el pedido",
        detail: e instanceof Error ? e.message : e,
      },
      { status: 500 }
    );
  }
}
