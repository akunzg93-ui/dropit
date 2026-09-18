// app/api/orders/recibido/route.ts

console.log("🔥 API /orders/recibido CARGADA");

import { getOrderServiceValue } from "@/lib/billing/getOrderServiceValue";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { sendEmail } from "@/lib/email";
import { emailPedidoListoParaRecoger } from "@/lib/emailTemplates/pedidoListoParaRecoger";

export async function POST(req: Request) {
  console.log("➡️ POST /api/orders/recibido");

  try {
    const { folio, codigo_vendedor } = await req.json();

    console.log("🟢 RECIBIDO body:", {
      folio,
      codigo_vendedor,
    });

    if (!folio || !codigo_vendedor) {
      return NextResponse.json(
        {
          error:
            "Folio y código del vendedor requeridos",
        },
        { status: 400 }
      );
    }

    const authorization =
      req.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const token = authorization.replace(
      "Bearer ",
      ""
    );

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        codigo_vendedor,
        codigo_entrega,
        email_comprador,
        correo_comprador_enviado,
        establecimiento_uuid,
        pedido_establecimientos (
          establecimientos (
            id,
            uuid,
            nombre,
            direccion
          )
        )
      `)
      .eq("folio", folio)
      .single();

    console.log(
      "🟢 RECIBIDO pedido:",
      pedido,
      error
    );

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const pedidoAny = pedido as any;

    if (!pedidoAny.establecimiento_uuid) {
      return NextResponse.json(
        {
          error:
            "Pedido sin establecimiento asignado",
        },
        { status: 400 }
      );
    }

    const {
      data: establecimientoAutorizado,
      error: establecimientoAuthError,
    } = await supabase
      .from("establecimientos")
      .select("uuid")
      .eq(
        "uuid",
        pedidoAny.establecimiento_uuid
      )
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (
      establecimientoAuthError ||
      !establecimientoAutorizado
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes autorización para recibir este pedido",
        },
        { status: 403 }
      );
    }

    if (
      pedidoAny.codigo_vendedor !==
      codigo_vendedor
    ) {
      return NextResponse.json(
        {
          error:
            "Código del vendedor incorrecto",
        },
        { status: 403 }
      );
    }

    if (pedidoAny.estado !== "en_transito") {
      return NextResponse.json(
        {
          error:
            "El pedido no está en estado válido para recepción",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // VALOR FINANCIERO DEL SERVICIO
    // =====================================================

    const serviceValue =
      await getOrderServiceValue(pedidoAny.id);

    console.log(
      "💰 Valor financiero del servicio:",
      {
        pedido_id: pedidoAny.id,
        coin_tipo: serviceValue.coinTipo,
        origen: serviceValue.origen,
        precio_unitario:
          serviceValue.precioUnitario,
        descuento:
          serviceValue.descuentoPorcentaje,
        monto_bruto:
          serviceValue.importeServicio,
      }
    );

    // =====================================================
    // RECEPCIÓN + BALANCE ATÓMICOS
    // =====================================================

    const {
      data: recepcion,
      error: recepcionError,
    } = await supabase.rpc(
      "recibir_pedido_con_balance",
      {
        p_pedido_id: pedidoAny.id,
        p_codigo_vendedor: codigo_vendedor,
        p_monto_bruto:
          serviceValue.importeServicio,
      }
    );

    if (recepcionError) {
      console.error(
        "💥 ERROR RECEPCIÓN ATÓMICA:",
        recepcionError
      );

      return NextResponse.json(
        {
          error:
            "No fue posible registrar la recepción del pedido",
        },
        { status: 500 }
      );
    }

    const codigoEntrega =
      recepcion?.codigo_entrega;

    if (!codigoEntrega) {
      console.error(
        "💥 RPC de recepción no devolvió código de entrega"
      );

      return NextResponse.json(
        {
          error:
            "La recepción fue registrada, pero no fue posible generar el código de entrega",
        },
        { status: 500 }
      );
    }

    console.log(
      "✅ RECEPCIÓN ATÓMICA OK:",
      recepcion
    );

    // =====================================================
    // QR
    // =====================================================

    const qrPayload =
      `${pedidoAny.folio}|${codigoEntrega}`;

    const qrBuffer = await QRCode.toBuffer(
      qrPayload,
      {
        margin: 1,
        width: 260,
      }
    );

    const fileName =
      `qr-recoleccion-${pedidoAny.folio}.png`;

    let uploadError = null;

    try {
      const { error } = await supabase.storage
        .from("qr-codes")
        .upload(fileName, qrBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      uploadError = error;
    } catch (err) {
      console.error(
        "⚠️ Storage crash:",
        err
      );
    }

    if (uploadError) {
      console.error(
        "⚠️ Storage upload error:",
        uploadError
      );
    }

    const { data: publicUrlData } =
      supabase.storage
        .from("qr-codes")
        .getPublicUrl(fileName);

    const qrUrl = publicUrlData.publicUrl;

    // =====================================================
    // ESTABLECIMIENTO
    // =====================================================

    const establecimiento =
      pedidoAny.pedido_establecimientos
        ?.map(
          (r: any) => r?.establecimientos
        )
        .find(
          (e: any) =>
            e?.uuid ===
            pedidoAny.establecimiento_uuid
        );

    const establecimientoNombre =
      establecimiento?.nombre ?? "—";

    const direccionEstablecimiento =
      establecimiento?.direccion ?? "—";

    // =====================================================
    // NOTIFICACIÓN AL CLIENTE
    // =====================================================

    if (!pedidoAny.correo_comprador_enviado) {
      await sendEmail({
        to: pedidoAny.email_comprador,
        subject:
          "📦 Tu pedido ya está listo para recoger",
        html: emailPedidoListoParaRecoger({
          folio: pedidoAny.folio,
          establecimiento:
            establecimientoNombre,
          direccion:
            direccionEstablecimiento,
          codigoEntrega,
          qrUrl,
        }),
      });

      await supabase
        .from("pedidos")
        .update({
          correo_comprador_enviado: true,
        })
        .eq("id", pedidoAny.id);
    }

    return NextResponse.json({
      ok: true,
      mensaje:
        "Pedido recibido y notificado al comprador",
      estado: "pendiente_recoleccion",
    });
  } catch (err) {
    console.error(
      "💥 ERROR RECIBIDO:",
      err
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}