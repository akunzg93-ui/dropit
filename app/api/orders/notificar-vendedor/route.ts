// app/api/orders/notificar-vendedor/route.ts

console.log("🔥 API /orders/notificar-vendedor CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { Resend } from "resend"; // ✅ NUEVO (en vez de nodemailer)

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

    // 4️⃣ Generar QR (folio|codigo_vendedor)
    const qrPayload = `${pedidoAny.folio}|${codigoVendedor}`;

    const qrBase64 = await QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 260,
    });

    const establecimiento =
      pedidoAny.pedido_establecimientos?.[0]?.establecimientos;

    const establecimientoNombre = establecimiento?.nombre ?? "—";
    const direccionEstablecimiento = establecimiento?.direccion ?? "—";

    // ✅ Resend (reemplazo de Mailtrap / nodemailer)
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject = "📦 Pedido confirmado – Llévalo al establecimiento"; // (si quieres deja [DEV])

    const html = `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
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
            <!-- HEADER -->
            <div style="
              background:linear-gradient(135deg, #2563eb, #1e40af);
              color:#ffffff;
              padding:28px;
            ">
              <h1 style="margin:0;font-size:22px;font-weight:600;">
                📦 Pedido creado correctamente
              </h1>
              <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">
                Lleva tu paquete al establecimiento
              </p>
            </div>

            <!-- BODY -->
            <div style="padding:28px;">
              <table style="width:100%; font-size:14px;">
                <tr>
                  <td style="padding:6px 0; color:#6b7280;">Pedido</td>
                  <td style="padding:6px 0; font-weight:600; text-align:right;">
                    ${pedidoAny.folio}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#6b7280;">Establecimiento</td>
                  <td style="padding:6px 0; text-align:right;">
                    ${establecimientoNombre}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0; color:#6b7280;">Dirección</td>
                  <td style="padding:6px 0; text-align:right;">
                    ${direccionEstablecimiento}
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

              <!-- CÓDIGO -->
              <div style="text-align:center;">
                <p style="margin-bottom:8px;color:#6b7280;font-size:13px;">
                  Código para entregar en el establecimiento
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
                  ${codigoVendedor}
                </div>

                <p style="margin:22px 0 12px 0;font-size:14px;">
                  Escanea el QR o presenta este código
                </p>

                <img
                  src="${qrBase64}"
                  alt="QR del pedido"
                  style="
                    width:160px;
                    height:160px;
                    border:8px solid #eef2ff;
                    border-radius:16px;
                  "
                />
              </div>
            </div>

            <!-- FOOTER -->
            <div style="
              background:#f9fafb;
              padding:18px;
              text-align:center;
              font-size:12px;
              color:#6b7280;
            ">
              <strong style="color:#2563eb;">DROPIT</strong><br />
              Este código se valida al recibir el paquete
            </div>
          </div>
        </div>
      `;

    const { data, error: resendError } = await resend.emails.send({
      from: "Dropit <no-reply@drop-itt.com>",
      to: pedidoAny.email_vendedor,
      subject,
      html,
    });

    if (resendError) {
      console.error("❌ RESEND ERROR:", resendError);
      return NextResponse.json(
        { error: "Error enviando correo", detalle: resendError },
        { status: 500 }
      );
    }

    console.log("✅ Resend enviado:", data);

    // 6️⃣ Marcar correo enviado
    await supabase
      .from("pedidos")
      .update({
        correo_vendedor_enviado: true,
        correo_vendedor_enviado_en: new Date().toISOString(),
      })
      .eq("id", pedidoAny.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ ERROR NOTIFICAR VENDEDOR:", err);
    return NextResponse.json(
      { error: "Error interno", detalle: String(err) },
      { status: 500 }
    );
  }
}