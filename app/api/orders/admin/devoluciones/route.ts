import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ESTADOS_DEVOLUCION = [
  "devolucion_pendiente",
  "devuelto",
  "custodia_vencida",
];

export async function GET(req: Request) {
  try {
    // ─────────────────────────────────────
    // AUTH
    // ─────────────────────────────────────

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

    // ─────────────────────────────────────
    // PEDIDOS EN FLUJO DE DEVOLUCIÓN
    // ─────────────────────────────────────

    const { data: pedidosData, error: pedidosError } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        producto,
        estado,
        email_vendedor,
        establecimiento_uuid,
        devolucion_iniciada_at,
        devuelto_at,
        custodia_vencida_at,
        created_at
      `)
      .in("estado", ESTADOS_DEVOLUCION)
      .order("devolucion_iniciada_at", {
        ascending: false,
        nullsFirst: false,
      });

    if (pedidosError) {
      console.error(
        "Error cargando devoluciones admin:",
        pedidosError
      );

      return NextResponse.json(
        { error: "No fue posible cargar las devoluciones" },
        { status: 500 }
      );
    }

    const pedidos = pedidosData || [];

    // ─────────────────────────────────────
    // ESTABLECIMIENTOS RELACIONADOS
    // ─────────────────────────────────────

    const establecimientosUuids = Array.from(
      new Set(
        pedidos
          .map((pedido) => pedido.establecimiento_uuid)
          .filter(
            (uuid): uuid is string =>
              typeof uuid === "string" && uuid.length > 0
          )
      )
    );

    let establecimientos: {
      uuid: string;
      nombre: string;
      zona: string | null;
    }[] = [];

    if (establecimientosUuids.length > 0) {
      const {
        data: establecimientosData,
        error: establecimientosError,
      } = await supabase
        .from("establecimientos")
        .select("uuid, nombre, zona")
        .in("uuid", establecimientosUuids);

      if (establecimientosError) {
        console.error(
          "Error cargando establecimientos de devoluciones:",
          establecimientosError
        );

        return NextResponse.json(
          {
            error:
              "No fue posible cargar los establecimientos de las devoluciones",
          },
          { status: 500 }
        );
      }

      establecimientos = establecimientosData || [];
    }

    const establecimientosPorUuid = new Map(
      establecimientos.map((establecimiento) => [
        establecimiento.uuid,
        establecimiento,
      ])
    );

    // ─────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────

    const devoluciones = pedidos.map((pedido) => {
      const establecimiento = pedido.establecimiento_uuid
        ? establecimientosPorUuid.get(pedido.establecimiento_uuid)
        : null;

      return {
        id: pedido.id,
        folio: pedido.folio,
        producto: pedido.producto,
        estado: pedido.estado,
        emailVendedor: pedido.email_vendedor,

        establecimiento: establecimiento
          ? {
              uuid: establecimiento.uuid,
              nombre: establecimiento.nombre,
              zona: establecimiento.zona,
            }
          : null,

        devolucionIniciadaAt: pedido.devolucion_iniciada_at,
        devueltoAt: pedido.devuelto_at,
        custodiaVencidaAt: pedido.custodia_vencida_at,
        createdAt: pedido.created_at,
      };
    });

    const resumen = {
      pendientes: devoluciones.filter(
        (pedido) => pedido.estado === "devolucion_pendiente"
      ).length,

      devueltas: devoluciones.filter(
        (pedido) => pedido.estado === "devuelto"
      ).length,

      custodiaVencida: devoluciones.filter(
        (pedido) => pedido.estado === "custodia_vencida"
      ).length,
    };

    return NextResponse.json({
      resumen,
      devoluciones,
    });
  } catch (error) {
    console.error("Error GET devoluciones admin:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}