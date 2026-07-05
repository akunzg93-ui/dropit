import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { emailPuntoEntregaConfirmado } from "@/lib/emailTemplates/puntoEntregaConfirmado";

export async function POST(req: Request) {
  try {
    const { correo, folio, establecimiento_nombre } = await req.json();

    if (!correo || !folio) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const html = emailPuntoEntregaConfirmado({
      folio,
      establecimientoNombre: establecimiento_nombre,
    });

    await sendEmail({
      to: correo,
      subject: `Punto de entrega confirmado · Dropit ${folio}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error enviando correo punto entrega:", error);

    return NextResponse.json(
      { error: "Error enviando correo" },
      { status: 500 }
    );
  }
}