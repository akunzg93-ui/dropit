import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

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
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
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

    const urlEvaluacion = `${process.env.NEXT_PUBLIC_SITE_URL}/evaluar/${pedido.id}`;

    // 📧 Correo al comprador
    try {
      await sendEmail({
        to: pedido.email_comprador,
        subject: "✅ Tu pedido fue entregado",
        html: `
          <div style="background:#f4f7fb;padding:32px;font-family:Arial,Helvetica,sans-serif;">
            <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.08);padding:28px;">
              
              <h2 style="color:#2563eb;margin-top:0;">
                📦 Pedido entregado
              </h2>

              <p style="font-size:15px;color:#334155;line-height:1.6;">
                ¡Buenas noticias! Tu pedido ya fue entregado correctamente.
              </p>

              <div style="background:#eff6ff;border-radius:12px;padding:16px;margin:20px 0;border:1px solid #dbeafe;">
                <p style="margin:0;font-size:13px;color:#64748b;">
                  Folio del pedido
                </p>
                <p style="margin:6px 0 0;font-size:20px;letter-spacing:1px;color:#2563eb;font-weight:700;">
                  ${pedido.folio}
                </p>
              </div>

              <p style="font-size:14px;color:#475569;line-height:1.6;">
                Gracias por usar <strong>Dropit</strong>. Tu opinión nos ayuda a mejorar la experiencia para todos.
              </p>

              <div style="text-align:center;margin-top:24px;">
                <a href="${urlEvaluacion}" 
                  style="display:inline-block;padding:14px 24px;
                  background:linear-gradient(90deg,#4f46e5,#2563eb);
                  color:white;border-radius:12px;
                  text-decoration:none;font-weight:700;">
                  ⭐ Evaluar experiencia
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

              <p style="font-size:12px;color:#94a3b8;text-align:center;margin:0;">
                Este correo es una confirmación automática de entrega.
              </p>
            </div>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("⚠️ Mail comprador falló:", mailErr);
    }

    // 📧 Correo al vendedor
    const { data: vendedor } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", pedido.vendedor_id)
      .maybeSingle();

    if (vendedor?.email) {
      try {
        await sendEmail({
          to: vendedor.email,
          subject: "📦 Pedido entregado al cliente",
          html: `
            <div style="background:#f4f7fb;padding:32px;font-family:Arial,Helvetica,sans-serif;">
              <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;box-shadow:0 8px 28px rgba(15,23,42,0.10);overflow:hidden;">
                
                <div style="background:linear-gradient(90deg,#1d4ed8,#2563eb,#4f46e5);padding:28px 24px;text-align:center;">
                  <div style="width:56px;height:56px;border-radius:50%;background:#ffffff;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:30px;">
                    ✅
                  </div>
                  <h1 style="margin:0;color:#ffffff;font-size:24px;line-height:1.3;">
                    Pedido entregado
                  </h1>
                  <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">
                    El paquete fue entregado correctamente al cliente.
                  </p>
                </div>

                <div style="padding:28px 24px;">
                  <p style="font-size:15px;color:#334155;line-height:1.6;margin:0 0 18px;">
                    Te confirmamos que el pedido se cerró exitosamente en Dropit.
                  </p>

                  <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:14px;padding:18px;margin:20px 0;">
                    <p style="margin:0;font-size:13px;color:#64748b;">
                      Folio del pedido
                    </p>
                    <p style="margin:6px 0 0;font-size:22px;letter-spacing:1px;color:#1d4ed8;font-weight:800;">
                      ${pedido.folio}
                    </p>
                  </div>

                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin:20px 0;">
                    <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">
                      Ya no se requiere ninguna acción adicional de tu parte para este pedido.
                    </p>
                  </div>

                  <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0;">
                    Gracias por usar <strong>Dropit</strong> para coordinar tus entregas.
                  </p>
                </div>

                <div style="background:#f8fafc;border-top:1px solid #e5e7eb;padding:16px 24px;text-align:center;">
                  <p style="font-size:12px;color:#94a3b8;margin:0;">
                    Este correo es una confirmación automática de entrega.
                  </p>
                </div>
              </div>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error("⚠️ Mail vendedor falló:", mailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      pedido_id: pedido.id,
      folio: pedido.folio,
    });
  } catch (err) {
    console.error("❌ ERROR ENTREGADO:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}