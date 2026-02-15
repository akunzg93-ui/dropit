import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  // 🔍 DEBUG: verificar que la env sí existe
  console.log("RESEND_API_KEY =", process.env.RESEND_API_KEY);

  const resend = new Resend(process.env.RESEND_API_KEY);

  const data = await resend.emails.send({
    from: "Entregas Web <onboarding@resend.dev>",
    to: "akunz93@gmail.com",
    subject: "🔥 Test Resend directo",
    html: "<p>Si ves esto en Resend, TODO está bien</p>",
  });

  return NextResponse.json({ ok: true, data });
}
