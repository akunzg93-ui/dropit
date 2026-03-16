import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    console.log("EMAIL RECIBIDO:", email);
console.log("SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.auth.admin.generateLink({
        
      type: "magiclink",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/post-login`
      }
    } as any);

    if (error) {
      console.error("generateLink error:", error);
      return NextResponse.json(
        { error: "No se pudo generar link" },
        { status: 500 }
      );
    }

    console.log("GENERATE LINK DATA:", data);
console.log("GENERATE LINK ERROR:", error);
    const link = data?.properties?.action_link;

    if (!link) {
      return NextResponse.json(
        { error: "No se pudo generar link" },
        { status: 500 }
      );
    }

    await sendEmail({
      to: email,
      subject: "Confirma tu cuenta de Dropit",
      html: `
        <div style="background:#f4f7fb;padding:32px;font-family:Arial,Helvetica,sans-serif;">
          <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,0.08);padding:28px;">
            
            <h2 style="color:#2d6cdf;margin-top:0;">
              📦 Bienvenido a Dropit
            </h2>

            <p style="font-size:15px;color:#333;">
              Para activar tu cuenta solo confirma tu correo electrónico.
            </p>

            <div style="text-align:center;margin:28px 0;">
              <a href="${link}" style="
                display:inline-block;
                padding:14px 26px;
                background:#2d6cdf;
                color:#fff;
                border-radius:8px;
                text-decoration:none;
                font-weight:600;
              ">
                Confirmar cuenta
              </a>
            </div>

            <p style="font-size:13px;color:#666;">
              Si no creaste esta cuenta puedes ignorar este correo.
            </p>

          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error("ERROR SEND VERIFICATION:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}