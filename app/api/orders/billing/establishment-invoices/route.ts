import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const user = await getBillingUser(req);
    const supabase = getAdminClient();

    // =====================================================
    // 1. Establecimientos pertenecientes al usuario
    // =====================================================

    const {
      data: establecimientos,
      error: establecimientosError,
    } = await supabase
      .from("establecimientos")
      .select(`
        id,
        uuid,
        nombre,
        fiscal_profile_id
      `)
      .eq("usuario_id", user.id);

    if (establecimientosError) {
      console.error(
        "Error obteniendo establecimientos:",
        establecimientosError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener los establecimientos",
        },
        { status: 500 }
      );
    }

    if (
      !establecimientos ||
      establecimientos.length === 0
    ) {
      return NextResponse.json({
        ok: true,
        invoices: [],
        pending_count: 0,
      });
    }

    const uuids = establecimientos
      .map((establecimiento) =>
        establecimiento.uuid
      )
      .filter(Boolean);

    // =====================================================
    // 2. Pedidos correspondientes al usuario
    // =====================================================

    const {
      data: pedidos,
      error: pedidosError,
    } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        establecimiento_uuid,
        recibido_en
      `)
      .in(
        "establecimiento_uuid",
        uuids
      );

    if (pedidosError) {
      console.error(
        "Error obteniendo pedidos:",
        pedidosError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener los pedidos",
        },
        { status: 500 }
      );
    }

    const pedidoIds =
      (pedidos || []).map(
        (pedido) => pedido.id
      );

    if (pedidoIds.length === 0) {
      return NextResponse.json({
        ok: true,
        invoices: [],
        pending_count: 0,
      });
    }

    // =====================================================
    // 3. Solicitudes de factura de esos pedidos
    // =====================================================

    const {
      data: solicitudes,
      error: solicitudesError,
    } = await supabase
      .from("invoice_requests")
      .select(`
        id,
        pedido_id,
        estado,
        fiscal_data_snapshot,
        fecha_solicitud,
        fecha_limite,

        invoices!inner (
          id,
          tipo_emisor,
          estado,
          uuid_fiscal,
          xml_path,
          pdf_path,
          fecha_emision,
          error_mensaje
        )
      `)
      .in(
        "pedido_id",
        pedidoIds
      )
      .eq(
        "invoices.tipo_emisor",
        "establecimiento"
      )
      .order(
        "fecha_solicitud",
        {
          ascending: false,
        }
      );

    if (solicitudesError) {
      console.error(
        "Error obteniendo facturas:",
        solicitudesError
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener las facturas",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 4. Movimientos financieros
    // =====================================================

    const {
      data: movimientos,
      error: movimientosError,
    } = await supabase
      .from("balance_movimientos")
      .select(`
        pedido_id,
        monto_bruto
      `)
      .in(
        "pedido_id",
        pedidoIds
      );

    if (movimientosError) {
      console.error(
        "Error obteniendo movimientos:",
        movimientosError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo obtener el importe de las facturas",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 5. Armar respuesta
    // =====================================================

    const pedidoMap = new Map(
      (pedidos || []).map(
        (pedido) => [
          pedido.id,
          pedido,
        ]
      )
    );

    const establecimientoMap =
      new Map(
        establecimientos.map(
          (establecimiento) => [
            establecimiento.uuid,
            establecimiento,
          ]
        )
      );

    const movimientoMap =
      new Map(
        (movimientos || []).map(
          (movimiento) => [
            movimiento.pedido_id,
            movimiento,
          ]
        )
      );

    const invoices =
      (solicitudes || []).map(
        (solicitud: any) => {
          const pedido =
            pedidoMap.get(
              solicitud.pedido_id
            );

          const establecimiento =
            pedido
              ? establecimientoMap.get(
                  pedido.establecimiento_uuid
                )
              : null;

          const movimiento =
            movimientoMap.get(
              solicitud.pedido_id
            );

          const invoice =
            Array.isArray(
              solicitud.invoices
            )
              ? solicitud.invoices[0]
              : solicitud.invoices;

          return {
            invoice_request_id:
              solicitud.id,

            pedido_id:
              solicitud.pedido_id,

            folio:
              pedido?.folio || null,

            establecimiento_id:
              establecimiento?.id ||
              null,

            establecimiento_uuid:
              establecimiento?.uuid ||
              null,

            establecimiento_nombre:
              establecimiento?.nombre ||
              null,

            fiscal_profile_id:
              establecimiento
                ?.fiscal_profile_id ||
              null,

            request_estado:
              solicitud.estado,

            fecha_solicitud:
              solicitud.fecha_solicitud,

            fecha_limite:
              solicitud.fecha_limite,

            receptor:
              solicitud.fiscal_data_snapshot,

            monto_esperado:
              movimiento
                ? Number(
                    movimiento.monto_bruto
                  )
                : null,

            invoice: invoice || null,
          };
        }
      );

    const pendingCount =
      invoices.filter(
        (item: any) =>
          item.invoice &&
          item.invoice.estado !==
            "emitida" &&
          item.invoice.estado !==
            "cancelada"
      ).length;

    return NextResponse.json({
      ok: true,
      invoices,
      pending_count:
        pendingCount,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado",
        },
        { status: 401 }
      );
    }

    console.error(
      "Error GET establishment invoices:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno",
      },
      { status: 500 }
    );
  }
}