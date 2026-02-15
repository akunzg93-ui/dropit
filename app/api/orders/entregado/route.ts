// app/api/orders/entregado/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { folio, codigo_entrega } = await req.json();

    if (!folio || !codigo_entrega) {
      return NextResponse.json(
        { error: "Folio y código requeridos" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Buscar pedido
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        codigo_entrega,
        email_comprador,
        vendedor_id
      `)
      .eq("folio", folio)
      .single();

    if (error || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (pedido.codigo_entrega !== codigo_entrega) {
      return NextResponse.json(
        { error: "Código incorrecto" },
        { status: 403 }
      );
    }

    if (pedido.estado === "entregado") {
      return NextResponse.json(
        { error: "El pedido ya fue entregado" },
        { status: 409 }
      );
    }

    // 2️⃣ Marcar como entregado
    await supabase
      .from("pedidos")
      .update({ estado: "entregado" })
      .eq("id", pedido.id);

    // 3️⃣ Obtener email del vendedor
    const { data: vendedor } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", pedido.vendedor_id)
      .maybeSingle();

    // 4️⃣ Mailtrap transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST!,
      port: Number(process.env.MAILTRAP_PORT),
      auth: {
        user: process.env.MAILTRAP_USER!,
        pass: process.env.MAILTRAP_PASS!,
      },
    });

    // 📧 Correo al comprador (BONITO ✨)
    try {
      await transporter.sendMail({
        from: process.env.MAILTRAP_FROM!,
        to: pedido.email_comprador,
        subject: "✅ Tu pedido fue entregado",
        html: `
          <div style="background:#f4f7fb;padding:32px;font-family:Arial,Helvetica,sans-serif;">
            <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.08);padding:28px;">
              
              <h2 style="color:#2d6cdf;margin-top:0;">
                📦 Pedido entregado
              </h2>

              <p style="font-size:15px;color:#333;">
                ¡Buenas noticias! Tu pedido ya fue entregado correctamente.
              </p>

              <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="margin:0;font-size:14px;color:#555;">
                  <strong>Folio del pedido</strong>
                </p>
                <p style="margin:4px 0 0;font-size:18px;letter-spacing:1px;color:#2d6cdf;">
                  ${pedido.folio}
                </p>
              </div>

              <p style="font-size:14px;color:#555;">
                Gracias por usar <strong>Entregas Web</strong>.  
                Esperamos verte pronto de nuevo 🙌
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

              <p style="font-size:12px;color:#888;text-align:center;">
                Este correo es una confirmación automática de entrega.
              </p>
            </div>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("⚠️ Mail comprador falló (DEV):", mailErr);
    }

    // 📧 Correo al vendedor (simple, sin romper flujo)
    if (vendedor?.email) {
      try {
        await transporter.sendMail({
          from: process.env.MAILTRAP_FROM!,
          to: vendedor.email,
          subject: "📦 Pedido entregado al comprador",
          html: `
            <h2>Pedido entregado</h2>
            <p>El pedido <strong>${pedido.folio}</strong> fue entregado exitosamente.</p>
          `,
        });
      } catch (mailErr) {
        console.error("⚠️ Mail vendedor falló (DEV):", mailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ ERROR ENTREGADO:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
