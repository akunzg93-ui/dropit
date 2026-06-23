import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const {
      admin_id,
      email_vendedor,
      coin_tipo,
      cantidad,
      motivo,
    } = await req.json();

    if (!admin_id || !email_vendedor || !coin_tipo || !cantidad) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    if (!["small", "medium"].includes(coin_tipo)) {
      return NextResponse.json(
        { error: "Tipo de coin inválido" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
      return NextResponse.json(
        { error: "Cantidad inválida" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", admin_id)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const { data: vendedorProfile, error: vendedorError } = await supabase
      .from("profiles")
      .select("id, role, email")
      .ilike("email", email_vendedor.trim())
      .single();

    if (vendedorError || !vendedorProfile) {
      return NextResponse.json(
        { error: "Vendedor no encontrado" },
        { status: 404 }
      );
    }

    if (vendedorProfile.role !== "vendor") {
      return NextResponse.json(
        { error: "El usuario seleccionado no es vendedor" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("admin_grant_coins", {
      p_user_id: vendedorProfile.id,
      p_coin_tipo: coin_tipo,
      p_cantidad: Number(cantidad),
      p_motivo: motivo || "Asignación manual por administrador",
    });

    if (error) {
      console.error("❌ Error admin_grant_coins:", error);
      return NextResponse.json(
        { error: "No se pudieron asignar los coins" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      vendedor: vendedorProfile.email,
      result: data,
    });
  } catch (err) {
    console.error("❌ ERROR ADMIN ASIGNAR COINS:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}