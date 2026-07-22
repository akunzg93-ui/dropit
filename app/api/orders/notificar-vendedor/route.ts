// app/api/orders/notificar-vendedor/route.ts

console.log("🔥 API /orders/notificar-vendedor CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { sendEmail } from "@/lib/email";
import { emailPedidoConfirmadoVendedor } from "@/lib/emailTemplates/pedidoConfirmadoVendedor";

// 🔐 Generar código de vendedor (6 dígitos)
function generarCodigoVendedor() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  console.log("➡️ POST /api/orders/notificar-vendedor");

  try {
    const body = await req.json();
    const { folio } = body;

    if (!folio) {
      return NextResponse.json({ error: "folio requerido" }, { status: 400 });
    }

    // 🔐 Supabase SERVICE ROLE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Obtener pedido + establecimientos
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        email_vendedor,
        codigo_vendedor,
        correo_vendedor_enviado,
        pedido_establecimientos (
          establecimientos (
            nombre,
            direccion
          )
        )
      `)
      .eq("folio", folio)
      .single();

    console.log("📦 Pedido:", pedido, error);

    if (error || !pedido) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const pedidoAny = pedido as any;

    // 2️⃣ Validaciones
    if (!["creado", "en_transito"].includes(pedidoAny.estado)) {
      return NextResponse.json(
        { error: "El pedido no está en estado creado" },
        { status: 409 }
      );
    }

    if (pedidoAny.correo_vendedor_enviado) {
      return NextResponse.json(
        { mensaje: "Correo al vendedor ya fue enviado" },
        { status: 200 }
      );
    }

    if (!pedidoAny.email_vendedor) {
      return NextResponse.json(
        { error: "Pedido sin email de vendedor" },
        { status: 409 }
      );
    }

    // 3️⃣ Código de vendedor
    let codigoVendedor = pedidoAny.codigo_vendedor;

    if (!codigoVendedor) {
      codigoVendedor = generarCodigoVendedor();

      await supabase
        .from("pedidos")
        .update({ codigo_vendedor: codigoVendedor })
        .eq("id", pedidoAny.id);
    }

    // 4️⃣ Generar QR (folio|codigo_vendedor) → PNG → Storage
    const qrPayload = `${pedidoAny.folio}|${codigoVendedor}`;

    const qrBuffer = await QRCode.toBuffer(qrPayload, {
      margin: 1,
      width: 260,
    });

    // subir a storage
    const fileName = `qr-vendedor-${pedidoAny.folio}.png`;

    const { error: uploadError } = await supabase.storage
      .from("qr-codes")
      .upload(fileName, qrBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
  console.error(
    "❌ Storage upload error:",
    uploadError
  );
}

    const { data: publicUrlData } = supabase.storage
      .from("qr-codes")
      .getPublicUrl(fileName);

    const qrUrl =
  publicUrlData?.publicUrl || "";

    const establecimiento =
      pedidoAny.pedido_establecimientos?.[0]?.establecimientos;

    const establecimientoNombre = establecimiento?.nombre ?? "—";
    const direccionEstablecimiento = establecimiento?.direccion ?? "—";


    const subject = "📦 Pedido confirmado – Llévalo al establecimiento";

   
   const { data, error: resendError } = await sendEmail({
  to: pedidoAny.email_vendedor,
  subject,
  html: emailPedidoConfirmadoVendedor({
    folio: pedidoAny.folio,
    establecimiento: establecimientoNombre,
    direccion: direccionEstablecimiento,
    codigoVendedor,
    qrUrl,
  }),
});

    if (resendError) {
      console.error("❌ RESEND ERROR:", resendError);
      return NextResponse.json(
        { error: "Error enviando correo", detalle: resendError },
        { status: 500 }
      );
    }

    console.log("✅ Resend enviado:", data);

    console.log("EMAIL DATA:", data);
console.log("EMAIL ERROR:", resendError);
console.log("EMAIL:", pedidoAny.email_vendedor);

    // 6️⃣ Marcar correo enviado
    await supabase
      .from("pedidos")
      .update({
        correo_vendedor_enviado: true,
        correo_vendedor_enviado_en: new Date().toISOString(),
      })
      .eq("id", pedidoAny.id);

    return NextResponse.json({ ok: true, qrUrl });
  } catch (err) {
    console.error("❌ ERROR NOTIFICAR VENDEDOR:", err);
    return NextResponse.json(
      { error: "Error interno", detalle: String(err) },
      { status: 500 }
    );
  }
}