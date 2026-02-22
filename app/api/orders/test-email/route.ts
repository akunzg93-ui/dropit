import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const data = await resend.emails.send({
    from: "Dropit <no-reply@drop-itt.com>",
    to: "akunzg93@gmail.com",
    subject: "🔥 Test Resend PROD",
    html: "<p>Si ves esto desde drop-itt.com, estamos en producción real 🚀</p>",
  });

  return NextResponse.json({ ok: true, data });
}