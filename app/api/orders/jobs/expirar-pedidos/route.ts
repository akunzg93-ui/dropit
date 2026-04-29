import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1️⃣ Buscar pedidos vencidos (1 día)
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("id, email_comprador, folio")
      .eq("estado", "pendiente_aprobacion_establecimiento")
      .lt(
        "establecimiento_notificado_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({ ok: true, procesados: 0 });
    }

    const ids = pedidos.map((p) => p.id);

    // 2️⃣ Resetear pedidos
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({
        estado: "creado",
        establecimiento_nombre: null,
        establecimiento_uuid: null,
        establecimiento_acepto: false,
      })
      .in("id", ids);

    if (updateError) throw updateError;

    // 3️⃣ Notificar compradores
    for (const p of pedidos) {
      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/send-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: p.email_comprador,
              subject: "Tu pedido expiró",
              html: `
                <h2>Tu pedido necesita atención</h2>
                <p>El establecimiento no respondió a tiempo.</p>
                <p>Por favor entra a la plataforma y elige otro establecimiento.</p>
                <p><strong>Folio:</strong> ${p.folio}</p>

                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/comprador/validar-pedido"
                   style="display:inline-block;margin-top:12px;padding:10px 16px;background:#4f46e5;color:white;border-radius:8px;text-decoration:none;">
                  Elegir otro establecimiento
                </a>
              `,
            }),
          }
        );
      } catch (err) {
        console.error("Error enviando correo expirado:", err);
      }
    }

    return NextResponse.json({
      ok: true,
      procesados: ids.length,
    });

  } catch (err) {
    console.error("Error expirando pedidos:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}