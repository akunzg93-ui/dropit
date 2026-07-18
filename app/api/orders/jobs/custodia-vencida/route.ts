import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { sendEmail } from "@/lib/email";
import { custodiaVencidaVendedor } from "@/lib/emailTemplates/custodiaVencidaVendedor";

export async function GET(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const fechaLimite = new Date(
      Date.now() - 48 * 60 * 60 * 1000
    ).toISOString();

    // Buscar devoluciones cuya custodia ya venció
    const { data: pedidos, error: pedidosError } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        vendedor_id,
        devolucion_iniciada_at
      `)
      .eq("estado", "devolucion_pendiente")
      .lte("devolucion_iniciada_at", fechaLimite);

    if (pedidosError) {
      throw pedidosError;
    }

    const resultados = [];

    for (const pedido of pedidos ?? []) {
      try {
        // 1. Cambiar el pedido a custodia_vencida
        const { data: resultadoRpc, error: rpcError } =
          await supabase.rpc("expire_order_return_custody", {
            p_pedido_id: pedido.id,
          });

        if (rpcError) {
          throw rpcError;
        }

        const vendedorId =
          resultadoRpc?.vendedor_id ?? pedido.vendedor_id;

        if (!vendedorId) {
          throw new Error("El pedido no tiene vendedor_id");
        }

        // 2. Obtener correo del vendedor desde Supabase Auth
        const {
          data: { user: vendedor },
          error: vendedorError,
        } = await supabase.auth.admin.getUserById(vendedorId);

        if (vendedorError) {
          throw vendedorError;
        }

        if (!vendedor?.email) {
          throw new Error(
            "No se encontró el correo del vendedor"
          );
        }

        // 3. Construir correo
        const correo = custodiaVencidaVendedor({
          folio: pedido.folio,
        });

        // 4. Enviar correo al vendedor
        await sendEmail({
          to: vendedor.email,
          subject: correo.subject,
          html: correo.html,
        });

        resultados.push({
          pedido_id: pedido.id,
          folio: pedido.folio,
          ok: true,
          estado: resultadoRpc?.estado ?? "custodia_vencida",
          email_enviado: true,
          destinatario: vendedor.email,
          resultado_rpc: resultadoRpc,
        });
      } catch (err) {
        const mensaje =
          err instanceof Error
            ? err.message
            : "Error desconocido";

        console.error(
          `❌ Error procesando pedido ${pedido.id}:`,
          err
        );

        resultados.push({
          pedido_id: pedido.id,
          folio: pedido.folio,
          ok: false,
          email_enviado: false,
          error: mensaje,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      fecha_limite: fechaLimite,
      encontrados: pedidos?.length ?? 0,
      procesados: resultados.length,
      procesados_correctamente: resultados.filter(
        (resultado) => resultado.ok
      ).length,
      procesados_con_error: resultados.filter(
        (resultado) => !resultado.ok
      ).length,
      resultados,
    });
  } catch (err) {
    const mensaje =
      err instanceof Error
        ? err.message
        : "Error desconocido";

    console.error("❌ Error en job de custodia vencida:", err);

    return NextResponse.json(
      {
        ok: false,
        error: mensaje,
      },
      { status: 500 }
    );
  }
}