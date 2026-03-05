import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailPedidoCreado } from "@/lib/emailTemplates/pedidoCreado";

export async function POST(req: Request) {
  try {
    const { correo, folio } = await req.json();

    if (!correo || !folio) {
      return NextResponse.json(
        { error: "Faltan datos" },
        { status: 400 }
      );
    }

    const html = emailPedidoCreado({ folio });

    await sendEmail({
      to: correo,
      subject: `Tu pedido Dropit ${folio}`,
      html,
    });

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Error enviando correo:", error);

    return NextResponse.json(
      { error: "Error enviando correo" },
      { status: 500 }
    );
  }
}