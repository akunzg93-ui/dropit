import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { admin_id } = await req.json();

    if (!admin_id) {
      return NextResponse.json({ error: "admin_id requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", admin_id)
      .single();

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data: vendedores, error: vendedoresError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("role", "vendor")
      .order("email", { ascending: true });

    if (vendedoresError) {
      console.error("❌ Error vendedores:", vendedoresError);
      return NextResponse.json(
        { error: "Error obteniendo vendedores" },
        { status: 500 }
      );
    }

    const vendedorIds = (vendedores || []).map((v) => v.id);

    if (vendedorIds.length === 0) {
      return NextResponse.json({ resumen: [], historial: [] });
    }

    const { data: lotes, error: lotesError } = await supabase
      .from("coin_lotes")
      .select(
        "id, user_id, tipo, cantidad_total, cantidad_disponible, fecha_expiracion, created_at"
      )
      .in("user_id", vendedorIds);

    if (lotesError) {
      console.error("❌ Error lotes:", lotesError);
      return NextResponse.json(
        { error: "Error obteniendo lotes" },
        { status: 500 }
      );
    }

    const { data: movimientosAdmin, error: movimientosAdminError } = await supabase
      .from("coin_movimientos")
      .select("id, user_id, lote_id, tipo, coin_tipo, cantidad, referencia, created_at")
      .in("user_id", vendedorIds)
      .ilike("referencia", "ADMIN_GRANT:%")
      .order("created_at", { ascending: false });

    if (movimientosAdminError) {
      console.error("❌ Error movimientos admin:", movimientosAdminError);
      return NextResponse.json(
        { error: "Error obteniendo movimientos admin" },
        { status: 500 }
      );
    }

    const adminLoteIds = (movimientosAdmin || [])
      .map((mov) => mov.lote_id)
      .filter(Boolean);

    let movimientosUsoAdmin: any[] = [];

    if (adminLoteIds.length > 0) {
      const { data: usos, error: usosError } = await supabase
        .from("coin_movimientos")
        .select("id, user_id, lote_id, tipo, coin_tipo, cantidad, referencia, created_at")
        .in("lote_id", adminLoteIds)
        .eq("tipo", "uso");

      if (usosError) {
        console.error("❌ Error usos admin:", usosError);
        return NextResponse.json(
          { error: "Error obteniendo consumos admin" },
          { status: 500 }
        );
      }

      movimientosUsoAdmin = usos || [];
    }

    const adminLoteIdSet = new Set(adminLoteIds);

    const resumen = (vendedores || []).map((vendedor) => {
      const lotesVendedor = (lotes || []).filter(
        (lote) => lote.user_id === vendedor.id
      );

      const adminGrantsVendedor = (movimientosAdmin || []).filter(
        (mov) => mov.user_id === vendedor.id
      );

      const adminUsosVendedor = movimientosUsoAdmin.filter(
        (mov) => mov.user_id === vendedor.id
      );

      const smallDisponibles = lotesVendedor
        .filter((lote) => lote.tipo === "small")
        .reduce((acc, lote) => acc + Number(lote.cantidad_disponible || 0), 0);

      const mediumDisponibles = lotesVendedor
        .filter((lote) => lote.tipo === "medium")
        .reduce((acc, lote) => acc + Number(lote.cantidad_disponible || 0), 0);

      const adminSmallAsignadas = adminGrantsVendedor
        .filter((mov) => mov.coin_tipo === "small")
        .reduce((acc, mov) => acc + Number(mov.cantidad || 0), 0);

      const adminMediumAsignadas = adminGrantsVendedor
        .filter((mov) => mov.coin_tipo === "medium")
        .reduce((acc, mov) => acc + Number(mov.cantidad || 0), 0);

      const adminSmallDisponibles = lotesVendedor
        .filter((lote) => lote.tipo === "small" && adminLoteIdSet.has(lote.id))
        .reduce((acc, lote) => acc + Number(lote.cantidad_disponible || 0), 0);

      const adminMediumDisponibles = lotesVendedor
        .filter((lote) => lote.tipo === "medium" && adminLoteIdSet.has(lote.id))
        .reduce((acc, lote) => acc + Number(lote.cantidad_disponible || 0), 0);

      const adminSmallConsumidas = adminUsosVendedor
        .filter((mov) => mov.coin_tipo === "small")
        .reduce((acc, mov) => acc + Number(mov.cantidad || 0), 0);

      const adminMediumConsumidas = adminUsosVendedor
        .filter((mov) => mov.coin_tipo === "medium")
        .reduce((acc, mov) => acc + Number(mov.cantidad || 0), 0);

      return {
        user_id: vendedor.id,
        email: vendedor.email,

        small_disponibles: smallDisponibles,
        medium_disponibles: mediumDisponibles,

        admin_small_asignadas: adminSmallAsignadas,
        admin_medium_asignadas: adminMediumAsignadas,
        admin_total_asignadas: adminSmallAsignadas + adminMediumAsignadas,

        admin_small_disponibles: adminSmallDisponibles,
        admin_medium_disponibles: adminMediumDisponibles,
        admin_total_disponibles:
          adminSmallDisponibles + adminMediumDisponibles,

        admin_small_consumidas: adminSmallConsumidas,
        admin_medium_consumidas: adminMediumConsumidas,
        admin_total_consumidas: adminSmallConsumidas + adminMediumConsumidas,
      };
    });

    const historial = (movimientosAdmin || []).map((mov) => {
      const vendedor = (vendedores || []).find((v) => v.id === mov.user_id);

      return {
        id: mov.id,
        user_id: mov.user_id,
        email: vendedor?.email || "Sin correo",
        coin_tipo: mov.coin_tipo,
        cantidad: mov.cantidad,
        motivo: String(mov.referencia || "").replace("ADMIN_GRANT:", "").trim(),
        referencia: mov.referencia,
        created_at: mov.created_at,
      };
    });

    return NextResponse.json({ resumen, historial });
  } catch (error) {
    console.error("❌ Error admin-resumen:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}