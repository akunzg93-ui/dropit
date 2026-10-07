import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Periodo = "7d" | "30d" | "90d" | "all";

const PERIODOS_VALIDOS: Periodo[] = ["7d", "30d", "90d", "all"];

function obtenerFechaInicio(periodo: Periodo) {
  if (periodo === "all") return null;

  const dias =
    periodo === "7d"
      ? 7
      : periodo === "30d"
        ? 30
        : 90;

  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);

  return fecha.toISOString();
}

function calcularPorcentaje(parte: number, total: number) {
  if (total === 0) return 0;

  return Number(((parte / total) * 100).toFixed(1));
}

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
    // FILTROS
    // ─────────────────────────────────────

    const url = new URL(req.url);

    const periodoParam = url.searchParams.get("period") || "30d";
    const zonaParam = url.searchParams.get("zona") || "all";

    if (!PERIODOS_VALIDOS.includes(periodoParam as Periodo)) {
      return NextResponse.json(
        { error: "Periodo inválido" },
        { status: 400 }
      );
    }

    const periodo = periodoParam as Periodo;
    const fechaInicio = obtenerFechaInicio(periodo);

    // ─────────────────────────────────────
    // ESTABLECIMIENTOS / ZONAS
    // ─────────────────────────────────────

    const { data: establecimientosData, error: establecimientosError } =
      await supabase
        .from("establecimientos")
        .select("uuid, zona, activo");

    if (establecimientosError) {
      console.error(
        "Error cargando establecimientos dashboard:",
        establecimientosError
      );

      return NextResponse.json(
        { error: "No fue posible cargar los establecimientos" },
        { status: 500 }
      );
    }

    const establecimientos = establecimientosData || [];

    const zonas = Array.from(
      new Set(
        establecimientos
          .map((establecimiento) => establecimiento.zona)
          .filter(
            (zona): zona is string =>
              typeof zona === "string" && zona.trim().length > 0
          )
      )
    ).sort((a, b) => a.localeCompare(b));

    if (zonaParam !== "all" && !zonas.includes(zonaParam)) {
      return NextResponse.json(
        { error: "Zona inválida" },
        { status: 400 }
      );
    }

    const establecimientosZona =
      zonaParam === "all"
        ? establecimientos
        : establecimientos.filter(
            (establecimiento) => establecimiento.zona === zonaParam
          );

    const uuidsZona = establecimientosZona.map(
      (establecimiento) => establecimiento.uuid
    );

    const establecimientosActivos = establecimientosZona.filter(
      (establecimiento) => establecimiento.activo === true
    ).length;

    // ─────────────────────────────────────
    // PEDIDOS
    // ─────────────────────────────────────

    let pedidosQuery = supabase
      .from("pedidos")
      .select("id, estado, created_at, establecimiento_uuid")
      .order("created_at", { ascending: true });

    if (fechaInicio) {
      pedidosQuery = pedidosQuery.gte("created_at", fechaInicio);
    }

    if (zonaParam !== "all") {
      if (uuidsZona.length === 0) {
        // La zona existe pero no tiene establecimientos asociados.
        // Evitamos ejecutar .in() con un arreglo vacío.
      } else {
        pedidosQuery = pedidosQuery.in(
          "establecimiento_uuid",
          uuidsZona
        );
      }
    }

    let pedidos: {
      id: number;
      estado: string;
      created_at: string;
      establecimiento_uuid: string | null;
    }[] = [];

    if (zonaParam !== "all" && uuidsZona.length === 0) {
      pedidos = [];
    } else {
      const { data: pedidosData, error: pedidosError } =
        await pedidosQuery;

      if (pedidosError) {
        console.error(
          "Error cargando pedidos dashboard:",
          pedidosError
        );

        return NextResponse.json(
          { error: "No fue posible cargar los pedidos" },
          { status: 500 }
        );
      }

      pedidos = pedidosData || [];
    }

    const totalPedidos = pedidos.length;

const pendientesAceptacion = pedidos.filter(
  (pedido) =>
    pedido.estado === "pendiente_aprobacion_establecimiento"
).length;

const enTransito = pedidos.filter(
  (pedido) => pedido.estado === "en_transito"
).length;

const pendientesRecoleccion = pedidos.filter(
  (pedido) => pedido.estado === "pendiente_recoleccion"
).length;

const entregados = pedidos.filter(
  (pedido) => pedido.estado === "entregado"
).length;

const devueltos = pedidos.filter(
  (pedido) => pedido.estado === "devuelto"
).length;

    const cancelados = pedidos.filter(
      (pedido) => pedido.estado === "cancelado"
    ).length;

    const tasaEntrega = calcularPorcentaje(
      entregados,
      totalPedidos
    );

    const tasaDevolucion = calcularPorcentaje(
      devueltos,
      totalPedidos
    );

    const tasaCancelacion = calcularPorcentaje(
      cancelados,
      totalPedidos
    );

    // ─────────────────────────────────────
   // ─────────────────────────────────────
// FINANZAS
// ─────────────────────────────────────

let movimientosQuery = supabase
  .from("balance_movimientos")
  .select(`
    id,
    pedido_id,
    establecimiento_id,
    monto_bruto,
    neto_establecimiento,
    comision_monto,
    iva_monto,
    status,
    created_at
  `);

if (fechaInicio) {
  movimientosQuery = movimientosQuery.gte(
    "created_at",
    fechaInicio
  );
}

if (zonaParam !== "all" && uuidsZona.length > 0) {
  movimientosQuery = movimientosQuery.in(
    "establecimiento_id",
    uuidsZona
  );
}

let brutoGenerado = 0;
let comisionDropit = 0;
let ivaComision = 0;
let cargoDropit = 0;
let netoEstablecimientos = 0;
let pagado = 0;
let pendientePorPagar = 0;
let disponible = 0;
let retiroEnProceso = 0;
let movimientosRevertidosMonto = 0;
let movimientosRevertidosOperaciones = 0;

let movimientos: any[] = [];

if (!(zonaParam !== "all" && uuidsZona.length === 0)) {
  const {
    data: movimientosData,
    error: movimientosError,
  } = await movimientosQuery;

  if (movimientosError) {
    console.error(
      "Error cargando movimientos dashboard:",
      movimientosError
    );

    return NextResponse.json(
      { error: "No fue posible cargar las métricas financieras" },
      { status: 500 }
    );
  }

  movimientos = movimientosData || [];

  const movimientosValidos = movimientos.filter(
    (movimiento) => movimiento.status !== "reversed"
  );

  const movimientosRevertidos = movimientos.filter(
    (movimiento) => movimiento.status === "reversed"
  );

  brutoGenerado = movimientosValidos.reduce(
    (total, movimiento) =>
      total + Number(movimiento.monto_bruto || 0),
    0
  );

  netoEstablecimientos = movimientosValidos.reduce(
    (total, movimiento) =>
      total + Number(movimiento.neto_establecimiento || 0),
    0
  );

comisionDropit = movimientosValidos.reduce(
  (total, movimiento) =>
    total + Number(movimiento.comision_monto || 0),
  0
);

ivaComision = movimientosValidos.reduce(
  (total, movimiento) =>
    total + Number(movimiento.iva_monto || 0),
  0
);

cargoDropit = comisionDropit + ivaComision;

  pagado = movimientosValidos
    .filter((movimiento) => movimiento.status === "paid")
    .reduce(
      (total, movimiento) =>
        total + Number(movimiento.neto_establecimiento || 0),
      0
    );

  pendientePorPagar = movimientosValidos
    .filter((movimiento) => movimiento.status !== "paid")
    .reduce(
      (total, movimiento) =>
        total + Number(movimiento.neto_establecimiento || 0),
      0
    );

  movimientosRevertidosMonto = movimientosRevertidos.reduce(
    (total, movimiento) =>
      total + Number(movimiento.monto_bruto || 0),
    0
  );

  movimientosRevertidosOperaciones =
    movimientosRevertidos.length;
}

// ─────────────────────────────────────
// DESGLOSE PENDIENTE POR PAGAR
// ─────────────────────────────────────

let retirosActivosQuery = supabase
  .from("retiros")
  .select(`
    id,
    retiro_aplicaciones (
      balance_movimiento_id,
      monto_aplicado
    )
  `)
  .in("status", ["pending", "approved"]);

if (zonaParam !== "all" && uuidsZona.length > 0) {
  retirosActivosQuery = retirosActivosQuery.in(
    "establecimiento_id",
    uuidsZona
  );
}

if (!(zonaParam !== "all" && uuidsZona.length === 0)) {
  const {
    data: retirosActivos,
    error: retirosActivosError,
  } = await retirosActivosQuery;

  if (retirosActivosError) {
    console.error(
      "Error cargando retiros activos dashboard:",
      retirosActivosError
    );

    return NextResponse.json(
      { error: "No fue posible cargar el desglose de pagos" },
      { status: 500 }
    );
  }

  const idsMovimientosEnRetiro = new Set<number>();

  for (const retiro of retirosActivos || []) {
    for (const aplicacion of retiro.retiro_aplicaciones || []) {
      idsMovimientosEnRetiro.add(
        Number(aplicacion.balance_movimiento_id)
      );
    }
  }

  const movimientosPendientes = movimientos.filter(
    (movimiento) =>
      movimiento.status !== "paid" &&
      movimiento.status !== "reversed"
  );

  retiroEnProceso = movimientosPendientes
    .filter((movimiento) =>
      idsMovimientosEnRetiro.has(Number(movimiento.id))
    )
    .reduce(
      (total, movimiento) =>
        total + Number(movimiento.neto_establecimiento || 0),
      0
    );

  disponible = movimientosPendientes
    .filter(
      (movimiento) =>
        !idsMovimientosEnRetiro.has(Number(movimiento.id))
    )
    .reduce(
      (total, movimiento) =>
        total + Number(movimiento.neto_establecimiento || 0),
      0
    );
}

// ─────────────────────────────────────
// CONTROL: FACTURACIÓN PENDIENTE
// ─────────────────────────────────────

let pendienteFacturaMonto = 0;
let pendienteFacturaOperaciones = 0;
let facturasProcesando = 0;
let facturasConError = 0;

let facturasQuery = supabase
  .from("invoices")
  .select(`
    id,
    estado,
    invoice_requests!inner (
      pedido_id
    )
  `)
  .eq("tipo_emisor", "establecimiento")
  .in("estado", ["pendiente", "procesando", "error"]);

const {
  data: facturasPendientes,
  error: facturasError,
} = await facturasQuery;

if (facturasError) {
  console.error(
    "Error cargando facturas pendientes dashboard:",
    facturasError
  );

  return NextResponse.json(
    { error: "No fue posible cargar el control de facturación" },
    { status: 500 }
  );
}

const movimientosPorPedido = new Map(
  movimientos.map((movimiento) => [
    Number(movimiento.pedido_id),
    movimiento,
  ])
);

for (const factura of facturasPendientes || []) {
  const request = Array.isArray(factura.invoice_requests)
    ? factura.invoice_requests[0]
    : factura.invoice_requests;

  const pedidoId = Number(request?.pedido_id);

  const movimiento = movimientosPorPedido.get(pedidoId);

  // Si no pertenece al periodo/zona seleccionados,
  // no entra en esta métrica.
  if (!movimiento) continue;

  // Un movimiento revertido ya no representa
  // bruto válido pendiente de facturación.
  if (movimiento.status === "reversed") continue;

  pendienteFacturaMonto += Number(
    movimiento.monto_bruto || 0
  );

  pendienteFacturaOperaciones += 1;

  if (factura.estado === "procesando") {
    facturasProcesando += 1;
  }

  if (factura.estado === "error") {
    facturasConError += 1;
  }
}

// ─────────────────────────────────────
// CONTROL: CANCELACIONES / REINTEGROS
// ─────────────────────────────────────

const pedidosCanceladosIds = pedidos
  .filter((pedido) => pedido.estado === "cancelado")
  .map((pedido) => pedido.id);

const pedidosCancelados = pedidosCanceladosIds.length;

let coinsReintegradas = 0;
let cancelacionesSinReintegro = 0;

if (pedidosCanceladosIds.length > 0) {
  const referenciasCancelacion = pedidosCanceladosIds.map(
    (pedidoId) => `cancelacion:${pedidoId}`
  );

  const {
    data: reintegrosData,
    error: reintegrosError,
  } = await supabase
    .from("coin_movimientos")
    .select("id, referencia, cantidad")
    .eq("tipo", "reintegro_cancelacion")
    .in("referencia", referenciasCancelacion);

  if (reintegrosError) {
    console.error(
      "Error cargando reintegros dashboard:",
      reintegrosError
    );

    return NextResponse.json(
      { error: "No fue posible cargar los reintegros de Coins" },
      { status: 500 }
    );
  }

  const reintegros = reintegrosData || [];

  coinsReintegradas = reintegros.reduce(
    (total, movimiento) =>
      total + Number(movimiento.cantidad || 0),
    0
  );

  const referenciasReintegradas = new Set(
    reintegros.map((movimiento) => movimiento.referencia)
  );

  cancelacionesSinReintegro = pedidosCanceladosIds.filter(
    (pedidoId) =>
      !referenciasReintegradas.has(`cancelacion:${pedidoId}`)
  ).length;
}

    // ─────────────────────────────────────
    // REQUIEREN ATENCIÓN
    // ─────────────────────────────────────

    let retirosQuery = supabase
      .from("retiros")
      .select("id, establecimiento_id", {
        count: "exact",
        head: false,
      })
      .in("status", ["pending", "approved"]);

    if (zonaParam !== "all" && uuidsZona.length > 0) {
      retirosQuery = retirosQuery.in(
        "establecimiento_id",
        uuidsZona
      );
    }

    let retirosPendientes = 0;

    if (!(zonaParam !== "all" && uuidsZona.length === 0)) {
      const {
        count: retirosCount,
        error: retirosError,
      } = await retirosQuery;

      if (retirosError) {
        console.error(
          "Error cargando retiros dashboard:",
          retirosError
        );

        return NextResponse.json(
          { error: "No fue posible cargar los retiros" },
          { status: 500 }
        );
      }

      retirosPendientes = retirosCount || 0;
    }

    let devolucionesQuery = supabase
      .from("pedidos")
      .select("id", {
        count: "exact",
        head: false,
      })
      .eq("estado", "devolucion_pendiente");

    if (zonaParam !== "all" && uuidsZona.length > 0) {
      devolucionesQuery = devolucionesQuery.in(
        "establecimiento_uuid",
        uuidsZona
      );
    }

    let devolucionesPendientes = 0;

    if (!(zonaParam !== "all" && uuidsZona.length === 0)) {
      const {
        count: devolucionesCount,
        error: devolucionesError,
      } = await devolucionesQuery;

      if (devolucionesError) {
        console.error(
          "Error cargando devoluciones dashboard:",
          devolucionesError
        );

        return NextResponse.json(
          { error: "No fue posible cargar las devoluciones" },
          { status: 500 }
        );
      }

      devolucionesPendientes = devolucionesCount || 0;
    }

    // ─────────────────────────────────────
    // GRÁFICA: PEDIDOS POR ESTADO
    // ─────────────────────────────────────

    const pedidosPorEstado = Object.entries(
      pedidos.reduce<Record<string, number>>(
        (acumulado, pedido) => {
          acumulado[pedido.estado] =
            (acumulado[pedido.estado] || 0) + 1;

          return acumulado;
        },
        {}
      )
    ).map(([estado, cantidad]) => ({
      estado,
      cantidad,
    }));

    // ─────────────────────────────────────
    // GRÁFICA: PEDIDOS EN EL TIEMPO
    // ─────────────────────────────────────

    const pedidosPorDia = pedidos.reduce<Record<string, number>>(
      (acumulado, pedido) => {
        const fecha = pedido.created_at.slice(0, 10);

        acumulado[fecha] = (acumulado[fecha] || 0) + 1;

        return acumulado;
      },
      {}
    );

    const pedidosTiempo = Object.entries(pedidosPorDia)
      .sort(([fechaA], [fechaB]) =>
        fechaA.localeCompare(fechaB)
      )
      .map(([fecha, cantidad]) => ({
        fecha,
        cantidad,
      }));

    // ─────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────

    return NextResponse.json({
      filtros: {
        periodo,
        zona: zonaParam,
      },

      kpis: {
  pedidos: totalPedidos,
  pendientesAceptacion,
  enTransito,
  pendientesRecoleccion,
  entregados,
  tasaEntrega,
  tasaDevolucion,
  tasaCancelacion,
  establecimientosActivos,
  valorGenerado: Number(brutoGenerado.toFixed(2)),
},

finanzas: {
  brutoGenerado: Number(brutoGenerado.toFixed(2)),
  comisionDropit: Number(comisionDropit.toFixed(2)),
  ivaComision: Number(ivaComision.toFixed(2)),
  cargoDropit: Number(cargoDropit.toFixed(2)),
  netoEstablecimientos: Number(netoEstablecimientos.toFixed(2)),
  pagado: Number(pagado.toFixed(2)),
  pendientePorPagar: Number(pendientePorPagar.toFixed(2)),
  disponible: Number(disponible.toFixed(2)),
  retiroEnProceso: Number(retiroEnProceso.toFixed(2)),
},

control: {
  pendienteFacturaMonto: Number(
    pendienteFacturaMonto.toFixed(2)
  ),
  pendienteFacturaOperaciones,
  facturasProcesando,
  facturasConError,

  pedidosCancelados,
  coinsReintegradas,
  cancelacionesSinReintegro,

  movimientosRevertidosMonto: Number(
    movimientosRevertidosMonto.toFixed(2)
  ),
  movimientosRevertidosOperaciones,
},

      atencion: {
        retirosPendientes,
        devolucionesPendientes,
      },

      graficas: {
        pedidosTiempo,
        pedidosEstado: pedidosPorEstado,
      },

      zonas,
    });
  } catch (error) {
    console.error("Error GET dashboard admin:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}