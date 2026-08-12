import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

const BILLING_TIMEZONE = "America/Mexico_City";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function obtenerFechaLimiteFactura(recibidoEn: string) {
  const recibido = new Date(recibidoEn);

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BILLING_TIMEZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(recibido);

  const year = Number(
    parts.find((part) => part.type === "year")?.value
  );

  const month = Number(
    parts.find((part) => part.type === "month")?.value
  );

  if (!year || !month) {
    throw new Error("INVALID_BILLING_DATE");
  }

  const nextMonth =
    month === 12
      ? { year: year + 1, month: 1 }
      : { year, month: month + 1 };

  /*
    La solicitud deja de estar disponible al iniciar
    el primer día del mes siguiente en Ciudad de México.

    CDMX opera actualmente en UTC-6.
  */
  return new Date(
    `${nextMonth.year}-${String(nextMonth.month).padStart(
      2,
      "0"
    )}-01T00:00:00-06:00`
  );
}

export async function GET(req: Request) {
  try {
    const user = await getBillingUser(req);
    const supabase = getAdminClient();

    const { searchParams } = new URL(req.url);
    const pedidoId = searchParams.get("pedido_id");

    /*
      Si viene pedido_id, consultamos únicamente
      el estado de facturación de ese pedido.

      Esto lo utiliza el Drawer de Mis Pedidos
      para reconstruir la timeline incluso después
      de recargar la página.
    */
    if (pedidoId) {
      const pedidoIdNumero = Number(pedidoId);

      if (
        !Number.isInteger(pedidoIdNumero) ||
        pedidoIdNumero <= 0
      ) {
        return NextResponse.json(
          { error: "pedido_id inválido" },
          { status: 400 }
        );
      }

      const { data: solicitud, error } = await supabase
        .from("invoice_requests")
        .select(`
          id,
          pedido_id,
          estado,
          fecha_solicitud,
          fecha_limite,
          fecha_completada,
          motivo_rechazo,
          created_at,

          invoices (
            id,
            tipo_emisor,
            estado,
            uuid_fiscal,
            serie,
            folio,
            subtotal,
            impuestos,
            total,
            xml_path,
            pdf_path,
            fecha_emision,
            fecha_cancelacion,
            error_mensaje
          )
        `)
        .eq("pedido_id", pedidoIdNumero)
        .eq("vendedor_id", user.id)
        .maybeSingle();

      if (error) {
        console.error(
          "Error obteniendo solicitud de factura del pedido:",
          error
        );

        return NextResponse.json(
          {
            error:
              "No se pudo obtener el estado de facturación",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        invoice_request: solicitud ?? null,
      });
    }

    /*
      Sin pedido_id conservamos el comportamiento
      existente: listar todas las solicitudes
      del vendedor.
    */
    const { data, error } = await supabase
      .from("invoice_requests")
      .select(`
        id,
        pedido_id,
        estado,
        fecha_solicitud,
        fecha_limite,
        fecha_completada,
        motivo_rechazo,
        created_at,

        pedidos (
          folio,
          estado,
          recibido_en
        ),

        fiscal_profiles (
          id,
          nombre_perfil
        ),

        invoices (
          id,
          tipo_emisor,
          estado,
          uuid_fiscal,
          serie,
          folio,
          subtotal,
          impuestos,
          total,
          xml_path,
          pdf_path,
          fecha_emision,
          fecha_cancelacion,
          error_mensaje
        )
      `)
      .eq("vendedor_id", user.id)
      .order("fecha_solicitud", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error obteniendo solicitudes de factura:",
        error
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron obtener las solicitudes de factura",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      invoice_requests: data ?? [],
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    console.error(
      "Error GET invoice requests:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getBillingUser(req);

    const {
      pedido_id,
      fiscal_profile_id,
    } = await req.json();

    if (!pedido_id || !fiscal_profile_id) {
      return NextResponse.json(
        {
          error:
            "Pedido y perfil fiscal son obligatorios",
        },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 1. Pedido
    const {
      data: pedido,
      error: pedidoError,
    } = await supabase
      .from("pedidos")
      .select(`
        id,
        vendedor_id,
        estado,
        recibido_en
      `)
      .eq("id", pedido_id)
      .eq("vendedor_id", user.id)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (!pedido.recibido_en) {
      return NextResponse.json(
        {
          error:
            "El servicio todavía no ha iniciado",
        },
        { status: 409 }
      );
    }

    // 2. Confirmar Coin consumida
    const {
      data: movimiento,
      error: movimientoError,
    } = await supabase
      .from("coin_movimientos")
      .select("id")
      .eq("user_id", user.id)
      .eq("tipo", "uso")
      .eq(
        "referencia",
        `pedido:${pedido_id}`
      )
      .limit(1)
      .maybeSingle();

    if (movimientoError) {
      console.error(
        "Error validando consumo de Coin:",
        movimientoError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo validar la Coin del pedido",
        },
        { status: 500 }
      );
    }

    if (!movimiento) {
      return NextResponse.json(
        {
          error:
            "La Coin del pedido todavía no ha sido consumida",
        },
        { status: 409 }
      );
    }

    // 3. Evitar solicitud duplicada
    const {
      data: solicitudExistente,
      error: solicitudExistenteError,
    } = await supabase
      .from("invoice_requests")
      .select("id")
      .eq("pedido_id", pedido_id)
      .maybeSingle();

    if (solicitudExistenteError) {
      console.error(
        "Error validando solicitud existente:",
        solicitudExistenteError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo validar la solicitud de factura",
        },
        { status: 500 }
      );
    }

    if (solicitudExistente) {
      return NextResponse.json(
        {
          error:
            "Este pedido ya tiene una solicitud de factura",
        },
        { status: 409 }
      );
    }

    // 4. Perfil fiscal
    const {
      data: perfil,
      error: perfilError,
    } = await supabase
      .from("fiscal_profiles")
      .select(`
        id,
        nombre_perfil,
        rfc,
        razon_social,
        codigo_postal,
        regimen_fiscal,
        uso_cfdi,
        email
      `)
      .eq("id", fiscal_profile_id)
      .eq("user_id", user.id)
      .eq("activo", true)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.json(
        {
          error:
            "Perfil fiscal no encontrado",
        },
        { status: 404 }
      );
    }

    // 5. Snapshot fiscal
    const fiscalSnapshot = {
      rfc: perfil.rfc,
      razon_social:
        perfil.razon_social,
      codigo_postal:
        perfil.codigo_postal,
      regimen_fiscal:
        perfil.regimen_fiscal,
      uso_cfdi:
        perfil.uso_cfdi,
      email: perfil.email,
    };

    // 6. Fecha límite fiscal
    const fechaLimite =
      obtenerFechaLimiteFactura(
        pedido.recibido_en
      );

    if (new Date() >= fechaLimite) {
      return NextResponse.json(
        {
          error:
            "El periodo para solicitar factura ha finalizado",
        },
        { status: 409 }
      );
    }

    /*
      7. Crear:
      - invoice_request
      - invoice Dropit
      - invoice establecimiento
      - bloqueo settlement

      Todo dentro de la RPC/transacción existente.
    */
    const {
      data: requestId,
      error: requestError,
    } = await supabase.rpc(
      "create_billing_invoice_request",
      {
        p_pedido_id: pedido_id,
        p_vendedor_id: user.id,
        p_fiscal_profile_id:
          fiscal_profile_id,
        p_fiscal_snapshot:
          fiscalSnapshot,
        p_fecha_limite:
          fechaLimite.toISOString(),
      }
    );

    if (requestError) {
      console.error(
        "Error creando solicitud de factura:",
        requestError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo crear la solicitud de factura",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        invoice_request_id:
          requestId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "INVALID_BILLING_DATE"
    ) {
      return NextResponse.json(
        {
          error:
            "No se pudo determinar la fecha límite de facturación",
        },
        { status: 500 }
      );
    }

    console.error(
      "Error POST invoice request:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}