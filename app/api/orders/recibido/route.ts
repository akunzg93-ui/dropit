// app/api/orders/recibido/route.ts

console.log("🔥 API /orders/recibido CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { sendEmail } from "@/lib/email"; // ✅ usamos helper central
import { emailPedidoListoParaRecoger } from "@/lib/emailTemplates/pedidoListoParaRecoger";

function generarCodigoEntrega() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  console.log("➡️ POST /api/orders/recibido");

  try {
    const { folio, codigo_vendedor } = await req.json();

    console.log("🟢 RECIBIDO body:", { folio, codigo_vendedor });

    if (!folio || !codigo_vendedor) {
      return NextResponse.json(
        { error: "Folio y código del vendedor requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    console.log("🟢 RECIBIDO pedido:", pedido, error);

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const pedidoAny = pedido as any;

    if (pedidoAny.codigo_vendedor !== codigo_vendedor) {
      return NextResponse.json(
        { error: "Código del vendedor incorrecto" },
        { status: 403 }
      );
    }

    if (pedidoAny.estado !== "en_transito") {
      return NextResponse.json(
        { error: "El pedido no está en estado válido para recepción" },
        { status: 409 }
      );
    }

    let codigoEntrega = pedidoAny.codigo_entrega;

    if (!codigoEntrega) {
      codigoEntrega = generarCodigoEntrega();

      await supabase
        .from("pedidos")
        .update({ codigo_entrega: codigoEntrega })
        .eq("id", pedidoAny.id);
    }

    await supabase
      .from("pedidos")
      .update({
        estado: "pendiente_recoleccion",
        recibido_en: new Date().toISOString(),
      })
      .eq("id", pedidoAny.id);
      // 🔥 GENERAR BALANCE (VERSIÓN FINAL ESTABLE)

try {
  console.log("🔥 INTENTO GENERAR BALANCE");

  const relaciones = pedidoAny.pedido_establecimientos || [];

// 🔥 tomar el que tenga uuid válido (primer match real)
const establecimientoMatch = relaciones.find(
  (r: any) => r?.establecimientos?.uuid
);

const establecimiento_id = establecimientoMatch?.establecimientos?.uuid;

console.log("🏪 establecimiento_id:", establecimiento_id);

  console.log("🏪 establecimiento_id:", establecimiento_id);

  if (!establecimiento_id) {
    console.error("❌ NO hay establecimiento_id");
  } else {
    const monto_bruto = 60;
    const comision_rate = 0.2;
    const iva_rate = 0.16;

    const comision_monto = monto_bruto * comision_rate;
    const iva_monto = comision_monto * iva_rate;
    const neto_establecimiento =
      monto_bruto - comision_monto - iva_monto;

    const { error } = await supabase
      .from("balance_movimientos")
      .insert({
        pedido_id: pedidoAny.id,
        establecimiento_id,
        moneda: "MXN",
        monto_bruto,
        comision_rate,
        iva_rate,
        comision_monto,
        iva_monto,
        neto_establecimiento,
        status: "available",
      });

    if (error) {
      console.error("💥 ERROR INSERT:", error);
    } else {
      console.log("✅ INSERT OK");
    }
  }
} catch (err) {
  console.error("💥 ERROR GENERAL:", err);
}
    // ✅ QR (folio|codigo_entrega) → PNG → Storage
    const qrPayload = `${pedidoAny.folio}|${codigoEntrega}`;

    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      margin: 1,
      width: 260,
    });

    const fileName = `qr-recoleccion-${pedidoAny.folio}.png`;

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
  console.error("⚠️ Storage crash:", err);
}

if (uploadError) {
  console.error("⚠️ Storage upload error:", uploadError);
}

    const { data: publicUrlData } = supabase.storage
      .from("qr-codes")
      .getPublicUrl(fileName);

    const qrUrl = publicUrlData.publicUrl;

    const establecimiento =
      pedidoAny.pedido_establecimientos?.[0]?.establecimientos;

    const establecimientoNombre = establecimiento?.nombre ?? "—";
    const direccionEstablecimiento = establecimiento?.direccion ?? "—";

    if (!pedidoAny.correo_comprador_enviado) {
      await sendEmail({
  to: pedidoAny.email_comprador,
  subject: "📦 Tu pedido ya está listo para recoger",
  html: emailPedidoListoParaRecoger({
    folio: pedidoAny.folio,
    establecimiento: establecimientoNombre,
    direccion: direccionEstablecimiento,
    codigoEntrega,
    qrUrl,
  }),
});
      await supabase
        .from("pedidos")
        .update({ correo_comprador_enviado: true })
        .eq("id", pedidoAny.id);
    }

    return NextResponse.json({
      ok: true,
      mensaje: "Pedido recibido y notificado al comprador",
      estado: "pendiente_recoleccion",
    });
  } catch (err) {
    console.error("💥 ERROR RECIBIDO:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}