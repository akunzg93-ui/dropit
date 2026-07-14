import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { emailPedidoCanceladoAutomatico } from "@/lib/emailTemplates/pedidoCanceladoAutomatico";

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization");

    if (
      !process.env.CRON_SECRET ||
      authorization !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const limite = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        email_comprador,
        email_vendedor,
        establecimiento_aceptado_at
      `)
      .eq("estado", "en_transito")
      .not("establecimiento_aceptado_at", "is", null)
      .lte("establecimiento_aceptado_at", limite)
      .limit(100);

    if (pedidosError) {
      console.error(
        "Error buscando pedidos vencidos:",
        pedidosError
      );

      return NextResponse.json(
        { error: "No se pudieron consultar los pedidos" },
        { status: 500 }
      );
    }

    const resultados = [];

    for (const pedido of pedidos || []) {
      const { error: cancelError } = await supabase.rpc(
        "cancel_order_automatic",
        {
          p_pedido_id: pedido.id,
        }
      );

      if (cancelError) {
        console.error(
          `Error cancelando pedido ${pedido.id}:`,
          cancelError
        );

        resultados.push({
          pedido_id: pedido.id,
          ok: false,
          error: cancelError.message,
        });

        continue;
      }

      let correoClienteEnviado = false;
      let correoVendedorEnviado = false;

      if (pedido.email_comprador) {
        try {
          await sendEmail({
            to: pedido.email_comprador,
            subject: `Pedido cancelado automáticamente · Dropit ${pedido.folio}`,
            html: emailPedidoCanceladoAutomatico({
              folio: pedido.folio,
              destinatario: "cliente",
            }),
          });

          correoClienteEnviado = true;
        } catch (error) {
          console.error(
            `Error enviando correo al cliente del pedido ${pedido.id}:`,
            error
          );
        }
      }

      if (pedido.email_vendedor) {
        try {
          await sendEmail({
            to: pedido.email_vendedor,
            subject: `Pedido cancelado por falta de entrega · Dropit ${pedido.folio}`,
            html: emailPedidoCanceladoAutomatico({
              folio: pedido.folio,
              destinatario: "vendedor",
            }),
          });

          correoVendedorEnviado = true;
        } catch (error) {
          console.error(
            `Error enviando correo al vendedor del pedido ${pedido.id}:`,
            error
          );
        }
      }

      resultados.push({
        pedido_id: pedido.id,
        ok: true,
        correo_cliente_enviado: correoClienteEnviado,
        correo_vendedor_enviado: correoVendedorEnviado,
      });
    }

    return NextResponse.json({
      ok: true,
      revisados: pedidos?.length || 0,
      cancelados: resultados.filter(
        (resultado) => resultado.ok
      ).length,
      resultados,
    });
  } catch (error) {
    console.error(
      "Error procesando cancelaciones automáticas:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}