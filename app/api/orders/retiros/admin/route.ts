import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    let query = supabase
      .from("retiros")
      .select(`
  id,
  monto,
  status,
  created_at,
  referencia_pago,
  establecimiento_id,
  titular_cuenta_destino,
  banco_destino,
  clabe_destino,
  establecimientos (
    nombre
  ),
  retiro_aplicaciones (
    id,
    monto_aplicado,
    balance_movimiento_id,
    balance_movimientos (
      id,
      pedido_id,
      establecimiento_id,
      created_at,
      pedidos (
        folio
      ),
      establecimientos (
        nombre
      )
    )
  )
`)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error cargando retiros admin:", error);

      return NextResponse.json(
        { error: "No fue posible cargar los retiros" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      retiros: data || [],
    });
  } catch (error) {
    console.error("Error GET retiros admin:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}