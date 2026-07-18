import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { emailDevolucionIniciadaVendedor } from "@/lib/emailTemplates/devolucionIniciadaVendedor";
import { emailDevolucionIniciadaCliente } from "@/lib/emailTemplates/devolucionIniciadaCliente";

type ResultadoDevolucion = {
  pedido_id: number;
  ok: boolean;
  error?: string;
  correo_cliente_enviado?: boolean;
  correo_vendedor_enviado?: boolean;
};

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
      Date.now() - 48 * 60 * 60 * 1000
    ).toISOString();

    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        recibido_en,
        email_comprador,
        email_vendedor
      `)
      .eq("estado", "pendiente_recoleccion")
      .not("recibido_en", "is", null)
      .lte("recibido_en", limite)
      .limit(100);

    if (pedidosError) {
      console.error(
        "Error buscando pedidos para devolución:",
        pedidosError
      );

      return NextResponse.json(
        { error: "No se pudieron consultar los pedidos" },
        { status: 500 }
      );
    }

    const resultados: ResultadoDevolucion[] = [];

    for (const pedido of pedidos || []) {
      const {
        data: codigoDevolucion,
        error: returnError,
      } = await supabase.rpc("start_order_return", {
        p_pedido_id: pedido.id,
      });

      if (returnError) {
        console.error(
          `Error iniciando devolución del pedido ${pedido.id}:`,
          returnError
        );

        resultados.push({
          pedido_id: pedido.id,
          ok: false,
          error: returnError.message,
        });

        continue;
      }

      let correoClienteEnviado = false;
      let correoVendedorEnviado = false;

      if (pedido.email_comprador) {
        try {
          await sendEmail({
            to: pedido.email_comprador,
            subject: `Tu pedido inició devolución · Dropit ${pedido.folio}`,
            html: emailDevolucionIniciadaCliente({
              folio: pedido.folio,
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

      if (pedido.email_vendedor && codigoDevolucion) {
        try {
          await sendEmail({
            to: pedido.email_vendedor,
            subject: `Recoge tu devolución · Dropit ${pedido.folio}`,
            html: emailDevolucionIniciadaVendedor({
              folio: pedido.folio,
              codigoDevolucion: String(codigoDevolucion),
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
      devoluciones_iniciadas: resultados.filter(
        (resultado) => resultado.ok
      ).length,
      resultados,
    });
  } catch (error) {
    console.error(
      "Error procesando devoluciones automáticas:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}