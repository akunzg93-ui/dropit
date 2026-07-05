import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { emailRechazoEstablecimiento } from "@/lib/emailTemplates/rechazoEstablecimiento";

export async function POST(req: Request) {
  try {
    const { pedido_id } = await req.json();

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

    const { data: pedido } = await supabase
      .from("pedidos")
      .select("email_comprador, folio")
      .eq("id", pedido_id)
      .single();

    if (!pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (!pedido.email_comprador || !pedido.folio) {
      return NextResponse.json(
        { error: "Pedido sin correo o folio" },
        { status: 400 }
      );
    }

    const html = emailRechazoEstablecimiento({
      folio: pedido.folio,
    });

    await sendEmail({
      to: pedido.email_comprador,
      subject: `Tu pedido sigue activo · Dropit ${pedido.folio}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error notificando comprador rechazo:", err);

    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}