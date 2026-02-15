// app/api/orders/recibido/route.ts

console.log("🔥 API /orders/recibido CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import QRCode from "qrcode";

// 🔐 Generar código de entrega (6 dígitos)
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

    // 🔐 Supabase SERVICE ROLE
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Obtener pedido + establecimiento
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

    // 2️⃣ Validaciones
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

    // 3️⃣ Código de entrega (si no existe)
    let codigoEntrega = pedidoAny.codigo_entrega;

    if (!codigoEntrega) {
      codigoEntrega = generarCodigoEntrega();

      await supabase
        .from("pedidos")
        .update({ codigo_entrega: codigoEntrega })
        .eq("id", pedidoAny.id);
    }

    // 4️⃣ Cambiar estado
    await supabase
      .from("pedidos")
      .update({
        estado: "pendiente_recoleccion",
        recibido_en: new Date().toISOString(),
      })
      .eq("id", pedidoAny.id);

    // ❌ SE ELIMINA el insert manual a pedido_eventos
    // El historial ahora lo maneja exclusivamente el trigger en la BD

    // 5️⃣ Generar QR (folio|codigo_entrega)
    const qrPayload = `${pedidoAny.folio}|${codigoEntrega}`;

    const qrBase64 = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 260,
    });

    // 6️⃣ Mailtrap
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST!,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USER!,
        pass: process.env.MAILTRAP_PASS!,
      },
    });

    const establecimiento =
      pedidoAny.pedido_establecimientos?.[0]?.establecimientos;

    const establecimientoNombre = establecimiento?.nombre ?? "—";
    const direccionEstablecimiento = establecimiento?.direccion ?? "—";

    if (!pedidoAny.correo_comprador_enviado) {
      await transporter.sendMail({
        from: process.env.MAILTRAP_FROM!,
        to: pedidoAny.email_comprador,
        subject: "📦 Tu pedido ya está listo para recoger [DEV]",
        html: `
          <div style="
            font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
            background-color:#f4f6f8;
            padding:40px 0;
          ">
            <div style="
              max-width:560px;
              margin:0 auto;
              background:#ffffff;
              border-radius:16px;
              overflow:hidden;
              box-shadow:0 12px 32px rgba(0,0,0,0.08);
            ">
              <div style="
                background:linear-gradient(135deg,#2563eb,#1e40af);
                color:#ffffff;
                padding:28px;
              ">
                <h1 style="margin:0;font-size:22px;font-weight:600;">
                  📦 Pedido listo para recoger
                </h1>
                <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">
                  Tu paquete ya llegó al establecimiento
                </p>
              </div>

              <div style="padding:28px;">
                <table style="width:100%; font-size:14px;">
                  <tr>
                    <td style="color:#6b7280;">Pedido</td>
                    <td style="font-weight:600;text-align:right;">
                      ${pedidoAny.folio}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;">Establecimiento</td>
                    <td style="text-align:right;">
                      ${establecimientoNombre}
                    </td>
                  </tr>
                  <tr>
                    <td style="color:#6b7280;">Dirección</td>
                    <td style="text-align:right;">
                      ${direccionEstablecimiento}
                    </td>
                  </tr>
                </table>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

                <div style="text-align:center;">
                  <p style="color:#6b7280;font-size:13px;">
                    Código de recolección
                  </p>

                  <div style="
                    font-size:32px;
                    letter-spacing:6px;
                    font-weight:700;
                    color:#1e40af;
                    background:#eef2ff;
                    padding:18px 24px;
                    border-radius:12px;
                    display:inline-block;
                  ">
                    ${codigoEntrega}
                  </div>

                  <p style="margin:22px 0 12px 0;font-size:14px;">
                    Presenta este código o escanea el QR
                  </p>

                  <img
                    src="${qrBase64}"
                    alt="QR de recolección"
                    style="
                      width:200px;
                      height:200px;
                      border:8px solid #eef2ff;
                      border-radius:16px;
                    "
                  />
                </div>
              </div>

              <div style="
                background:#f9fafb;
                padding:18px;
                text-align:center;
                font-size:12px;
                color:#6b7280;
              ">
                <strong style="color:#2563eb;">DROPIT</strong><br />
                Este código se valida al momento de la recolección
              </div>
            </div>
          </div>
        `,
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
