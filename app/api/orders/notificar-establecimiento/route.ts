// app/api/orders/notificar-establecimiento/route.ts

console.log("🔥 API /orders/notificar-establecimiento CARGADA");

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(req: Request) {
  console.log("➡️ POST /api/orders/notificar-establecimiento");

  try {
    const body = await req.json();
    const { pedido_id } = body;

    if (!pedido_id) {
      return NextResponse.json(
        { error: "pedido_id requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Obtener pedido
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        establecimiento_uuid
      `)
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const pedidoAny = pedido as any;

    // 2️⃣ Obtener establecimiento + dueño
    const { data: establecimiento, error: estError } = await supabase
      .from("establecimientos")
      .select(`
        nombre,
        usuario_id
      `)
      .eq("uuid", pedidoAny.establecimiento_uuid)
      .single();

    if (estError || !establecimiento) {
      return NextResponse.json(
        { error: "Establecimiento no encontrado" },
        { status: 404 }
      );
    }

    // 3️⃣ Obtener email desde profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", establecimiento.usuario_id)
      .single();

    if (profileError || !profile?.email) {
      return NextResponse.json(
        { error: "Usuario del establecimiento sin email" },
        { status: 409 }
      );
    }

    const emailDestino = profile.email;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject = "📦 Nuevo paquete llegará a tu establecimiento";

    const html = `
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
              📦 Nuevo paquete en camino
            </h1>
            <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">
              Un vendedor llevará un paquete a tu establecimiento
            </p>
          </div>

          <div style="padding:28px;">

            <table style="width:100%; font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#6b7280;">Pedido</td>
                <td style="padding:6px 0;font-weight:600;text-align:right;">
                  ${pedidoAny.folio}
                </td>
              </tr>

              <tr>
                <td style="padding:6px 0;color:#6b7280;">Establecimiento</td>
                <td style="padding:6px 0;text-align:right;">
                  ${establecimiento.nombre}
                </td>
              </tr>
            </table>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

            <p style="font-size:14px;color:#374151;">
              Un vendedor llegará próximamente con este paquete.
            </p>

            <p style="font-size:14px;color:#374151;">
              Podrás registrarlo desde tu panel de establecimiento.
            </p>

            <div style="text-align:center;margin-top:24px;">
              <a href="https://app.dropitt.net/establecimiento"
                 style="
                  background:#2563eb;
                  color:#ffffff;
                  padding:12px 22px;
                  border-radius:10px;
                  text-decoration:none;
                  font-weight:600;
                  font-size:14px;
                 ">
                 Abrir panel de establecimiento
              </a>
            </div>

          </div>

          <div style="
            background:#f9fafb;
            padding:18px;
            text-align:center;
            font-size:12px;
            color:#6b7280;
          ">
            <strong style="color:#2563eb;">DROPIT</strong><br/>
            Sistema logístico
          </div>

        </div>
      </div>
    `;

    const { error: resendError } = await resend.emails.send({
      from: "Dropit <no-reply@drop-itt.com>",
      to: emailDestino,
      subject,
      html,
    });

    if (resendError) {
      console.error("❌ RESEND ERROR:", resendError);
      return NextResponse.json(
        { error: "Error enviando correo" },
        { status: 500 }
      );
    }

    console.log("✅ Correo establecimiento enviado a:", emailDestino);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("❌ ERROR NOTIFICAR ESTABLECIMIENTO:", err);

    return NextResponse.json(
      { error: "Error interno", detalle: String(err) },
      { status: 500 }
    );
  }
}