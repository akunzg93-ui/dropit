import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const fromEmail =
      Deno.env.get("EMAIL_FROM") || "Entregas <onboarding@resend.dev>";

    const body = await req.json().catch(() => ({}));
    const pedido_id = Number(body?.pedido_id);

    if (!pedido_id) {
      return json({ error: "pedido_id requerido" }, 400);
    }

    // 🔐 Service Role (sin auth de usuario)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        producto,
        codigo_entrega,
        comprador:comprador_id ( email ),
        establecimiento:establecimiento_id (
          nombre,
          direccion,
          email
        )
      `)
      .eq("id", pedido_id)
      .single();

    if (error || !pedido) {
      return json({ error: "Pedido no encontrado" }, 404);
    }

    const compradorEmail = pedido.comprador?.email;
    const establecimientoEmail = pedido.establecimiento?.email;

    if (!compradorEmail || !establecimientoEmail) {
      return json({ error: "Emails incompletos" }, 400);
    }

    const resend = new Resend(resendApiKey);

    // 📧 Comprador
    await resend.emails.send({
      from: fromEmail,
      to: compradorEmail,
      subject: `✅ Pedido confirmado ${pedido.folio}`,
      html: `
        <h2>Pedido confirmado</h2>
        <p><strong>Folio:</strong> ${pedido.folio}</p>
        <p><strong>Producto:</strong> ${pedido.producto ?? "-"}</p>
        <p><strong>Punto de entrega:</strong><br/>
        ${pedido.establecimiento.nombre}<br/>
        ${pedido.establecimiento.direccion}</p>
        <p>🔐 <strong>Código de entrega:</strong></p>
        <h1>${pedido.codigo_entrega}</h1>
      `,
    });

    // 📧 Establecimiento
    await resend.emails.send({
      from: fromEmail,
      to: establecimientoEmail,
      subject: `📦 Nuevo pedido ${pedido.folio}`,
      html: `
        <h2>Nuevo pedido por entregar</h2>
        <p><strong>Folio:</strong> ${pedido.folio}</p>
        <p><strong>Producto:</strong> ${pedido.producto ?? "-"}</p>
        <p>🔐 <strong>Código de validación:</strong></p>
        <h1>${pedido.codigo_entrega}</h1>
      `,
    });

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: "Error interno" }, 500);
  }
});
