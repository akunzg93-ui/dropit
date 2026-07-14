import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { emailPedidoCancelado } from "@/lib/emailTemplates/pedidoCancelado";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("authorization");
    const accessToken = authorization?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        { error: "Sesión requerida" },
        { status: 401 }
      );
    }

    const { pedido_id } = await req.json();
    const pedidoId = Number(pedido_id);

    if (!pedidoId) {
      return NextResponse.json(
        { error: "pedido_id requerido" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        estado,
        vendedor_id,
        email_comprador
      `)
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    if (pedido.vendedor_id !== user.id) {
      return NextResponse.json(
        { error: "No tienes autorización para cancelar este pedido" },
        { status: 403 }
      );
    }

    const { error: cancelError } = await supabase.rpc(
      "cancel_order_by_vendor",
      {
        p_pedido_id: pedidoId,
        p_vendedor_id: user.id,
      }
    );

    if (cancelError) {
      console.error("Error cancelando pedido:", cancelError);

      return NextResponse.json(
        {
          error:
            cancelError.message ||
            "No se pudo cancelar el pedido",
        },
        { status: 409 }
      );
    }

    let correoEnviado = false;

    if (pedido.email_comprador && pedido.folio) {
      try {
        await sendEmail({
          to: pedido.email_comprador,
          subject: `Pedido cancelado · Dropit ${pedido.folio}`,
          html: emailPedidoCancelado({
            folio: pedido.folio,
          }),
        });

        correoEnviado = true;
      } catch (emailError) {
        console.error(
          "Pedido cancelado, pero falló el correo:",
          emailError
        );
      }
    }

    return NextResponse.json({
      ok: true,
      estado: "cancelado",
      coin_reintegrada: true,
      correo_enviado: correoEnviado,
    });
  } catch (error) {
    console.error("Error general cancelando pedido:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}