import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { emailPedidoEntregadoCliente } from "@/lib/emailTemplates/pedidoEntregadoCliente";
import { emailPedidoEntregadoVendedor } from "@/lib/emailTemplates/pedidoEntregadoVendedor";


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

// 📧 Correo al cliente
try {
  await sendEmail({
    to: pedido.email_comprador,
    subject: "✅ Tu pedido fue entregado",
    html: emailPedidoEntregadoCliente({
      folio: pedido.folio,
      urlEvaluacion,
    }),
  });
} catch (mailErr) {
  console.error("⚠️ Mail cliente falló:", mailErr);
}

// 📧 Obtener correo del vendedor
const { data: vendedor, error: vendedorError } = await supabase
  .from("profiles")
  .select("email")
  .eq("id", pedido.vendedor_id)
  .maybeSingle();

if (vendedorError) {
  console.error("⚠️ No se pudo consultar al vendedor:", vendedorError);
}

// 📧 Correo al vendedor
if (vendedor?.email) {
  try {
    await sendEmail({
      to: vendedor.email,
      subject: "📦 Pedido entregado al cliente",
      html: emailPedidoEntregadoVendedor({
        folio: pedido.folio,
      }),
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