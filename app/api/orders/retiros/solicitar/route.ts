import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { balance_movimiento_ids } = await req.json();

    if (
      !Array.isArray(balance_movimiento_ids) ||
      balance_movimiento_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "Debes seleccionar al menos un movimiento" },
        { status: 400 }
      );
    }

    const ids = [
      ...new Set(
        balance_movimiento_ids
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      ),
    ];

    if (ids.length !== balance_movimiento_ids.length) {
      return NextResponse.json(
        { error: "La selección contiene movimientos inválidos o duplicados" },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

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

    // 1. Obtener movimientos seleccionados
    const { data: movimientos, error: movimientosError } = await supabase
      .from("balance_movimientos")
      .select(`
        id,
        pedido_id,
        establecimiento_id,
        neto_establecimiento,
        status,
        created_at
      `)
      .in("id", ids);

    if (movimientosError) throw movimientosError;

    if (!movimientos || movimientos.length !== ids.length) {
      return NextResponse.json(
        { error: "Uno o más movimientos no existen" },
        { status: 400 }
      );
    }

    // 2. Obtener establecimientos involucrados
    const establecimientoIds = [
      ...new Set(
        movimientos.map((mov) => String(mov.establecimiento_id))
      ),
    ];

    const { data: establecimientos, error: establecimientosError } =
      await supabase
        .from("establecimientos")
        .select("uuid, usuario_id")
        .in("uuid", establecimientoIds);

    if (establecimientosError) throw establecimientosError;

    if (
      !establecimientos ||
      establecimientos.length !== establecimientoIds.length
    ) {
      return NextResponse.json(
        { error: "No fue posible validar los establecimientos" },
        { status: 400 }
      );
    }

    // 3. Todos los establecimientos deben pertenecer al usuario autenticado
    const establecimientoAjeno = establecimientos.some(
      (est) => est.usuario_id !== user.id
    );

    if (establecimientoAjeno) {
      return NextResponse.json(
        { error: "No tienes permiso para retirar estos movimientos" },
        { status: 403 }
      );
    }

    // 4. Validar cierre mensual
    // 4. Validar cierre mensual
// Regla oficial: el cierre se determina con horario de Ciudad de México.

const ahora = new Date();

const partesMexico = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Mexico_City",
  year: "numeric",
  month: "numeric",
}).formatToParts(ahora);

const yearMexico = Number(
  partesMexico.find((p) => p.type === "year")?.value
);

const monthMexico = Number(
  partesMexico.find((p) => p.type === "month")?.value
);

// Obtenemos año/mes de cada movimiento también en horario de México.
// Un movimiento es del mes abierto únicamente si pertenece
// al mismo año y mes calendario actual de Ciudad de México.
const movimientoMesAbierto = movimientos.find((mov) => {
  const partesMovimiento = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date(mov.created_at));

  const yearMovimiento = Number(
    partesMovimiento.find((p) => p.type === "year")?.value
  );

  const monthMovimiento = Number(
    partesMovimiento.find((p) => p.type === "month")?.value
  );

  return (
    yearMovimiento > yearMexico ||
    (yearMovimiento === yearMexico &&
      monthMovimiento >= monthMexico)
  );
});

if (movimientoMesAbierto) {
  return NextResponse.json(
    {
      error:
        "Uno o más movimientos pertenecen al mes actual y todavía no pueden retirarse",
    },
    { status: 400 }
  );
}

    if (movimientoMesAbierto) {
      return NextResponse.json(
        {
          error:
            "Uno o más movimientos pertenecen al mes actual y todavía no pueden retirarse",
        },
        { status: 400 }
      );
    }

    // 5. Nunca permitir movimientos ya pagados o reversados
    const movimientoNoRetirable = movimientos.find(
      (mov) => mov.status === "paid" || mov.status === "reversed"
    );

    if (movimientoNoRetirable) {
      return NextResponse.json(
        {
          error:
            "Uno o más movimientos seleccionados ya no están disponibles para retiro",
        },
        { status: 400 }
      );
    }

    // 6. Revisar si alguno ya pertenece a otro retiro activo
    const { data: aplicaciones, error: aplicacionesError } = await supabase
      .from("retiro_aplicaciones")
      .select(`
        balance_movimiento_id,
        retiro_id,
        retiros!inner (
          id,
          status
        )
      `)
      .in("balance_movimiento_id", ids);

    if (aplicacionesError) throw aplicacionesError;

    const tieneRetiroActivo = (aplicaciones || []).some((app: any) => {
      const status = app.retiros?.status;

      return status === "pending" || status === "approved";
    });

    if (tieneRetiroActivo) {
      return NextResponse.json(
        {
          error:
            "Uno o más movimientos ya pertenecen a una solicitud de retiro en proceso",
        },
        { status: 409 }
      );
    }

    // 7. Calcular total exclusivamente desde balance_movimientos
    const total = movimientos.reduce(
      (acc, mov) => acc + Number(mov.neto_establecimiento),
      0
    );

    const totalRedondeado = Number(total.toFixed(2));

    if (totalRedondeado <= 0) {
      return NextResponse.json(
        { error: "El retiro no tiene un monto válido" },
        { status: 400 }
      );
    }

    // 8. Crear cabecera global
    const { data: retiro, error: retiroError } = await supabase
      .from("retiros")
      .insert({
        user_id: user.id,
        establecimiento_id: null,
        monto: totalRedondeado,
        status: "pending",
      })
      .select("id")
      .single();

    if (retiroError) throw retiroError;

    // 9. Crear aplicaciones exactas por movimiento
    const aplicacionesInsert = movimientos.map((mov) => ({
      retiro_id: retiro.id,
      balance_movimiento_id: mov.id,
      monto_aplicado: Number(
        Number(mov.neto_establecimiento).toFixed(2)
      ),
    }));

    const { error: aplicacionesInsertError } = await supabase
      .from("retiro_aplicaciones")
      .insert(aplicacionesInsert);

    if (aplicacionesInsertError) {
      // Evitar dejar una cabecera huérfana si falla el detalle
      await supabase
        .from("retiros")
        .delete()
        .eq("id", retiro.id);

      throw aplicacionesInsertError;
    }

    // 10. Crear resumen por establecimiento
    const subtotales = new Map<string, number>();

    for (const mov of movimientos) {
      const establecimientoId = String(mov.establecimiento_id);

      subtotales.set(
        establecimientoId,
        (subtotales.get(establecimientoId) || 0) +
          Number(mov.neto_establecimiento)
      );
    }

    const detallesInsert = Array.from(subtotales.entries()).map(
      ([establecimiento_id, monto]) => ({
        retiro_id: retiro.id,
        establecimiento_id,
        monto: Number(monto.toFixed(2)),
      })
    );

    const { error: detallesError } = await supabase
      .from("retiro_detalles")
      .insert(detallesInsert);

    if (detallesError) {
      await supabase
        .from("retiro_aplicaciones")
        .delete()
        .eq("retiro_id", retiro.id);

      await supabase
        .from("retiros")
        .delete()
        .eq("id", retiro.id);

      throw detallesError;
    }

    return NextResponse.json({
      ok: true,
      retiro_id: retiro.id,
      movimientos: movimientos.length,
      establecimientos: establecimientoIds.length,
      monto: totalRedondeado,
    });
  } catch (e: any) {
    console.error("ERROR SOLICITAR RETIRO:", e);

    return NextResponse.json(
      { error: e?.message || "Error interno" },
      { status: 500 }
    );
  }
}