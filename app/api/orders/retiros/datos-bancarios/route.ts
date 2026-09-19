import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const AVISO_PRIVACIDAD_VERSION = "2026-09";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { user, supabase };
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);

    if (!auth) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;

    const { data, error } = await supabase
      .from("titular_datos_bancarios")
      .select(`
        titular_cuenta,
        clabe,
        banco,
        consentimiento_at,
        aviso_privacidad_version
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error consultando datos bancarios:", error);

      return NextResponse.json(
        { error: "No fue posible consultar los datos bancarios" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      datos_bancarios: data || null,
    });
  } catch (error) {
    console.error("Error GET datos bancarios:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser(req);

    if (!auth) {
      return NextResponse.json(
        { error: "Sesión inválida" },
        { status: 401 }
      );
    }

    const { user, supabase } = auth;
    const body = await req.json();

    const titularCuenta =
      typeof body?.titular_cuenta === "string"
        ? body.titular_cuenta.trim()
        : "";

    const clabe =
      typeof body?.clabe === "string"
        ? body.clabe.replace(/\s/g, "")
        : "";

    const banco =
      typeof body?.banco === "string"
        ? body.banco.trim()
        : "";

    const consentimiento = body?.consentimiento === true;

    if (titularCuenta.length < 3) {
      return NextResponse.json(
        { error: "Ingresa el nombre del titular de la cuenta" },
        { status: 400 }
      );
    }

    if (!/^\d{18}$/.test(clabe)) {
      return NextResponse.json(
        { error: "La CLABE debe contener 18 dígitos" },
        { status: 400 }
      );
    }

    if (!consentimiento) {
      return NextResponse.json(
        {
          error:
            "Debes autorizar el tratamiento de tus datos financieros",
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("titular_datos_bancarios")
      .upsert(
        {
          user_id: user.id,
          titular_cuenta: titularCuenta,
          clabe,
          banco: banco || null,
          consentimiento_at: now,
          aviso_privacidad_version: AVISO_PRIVACIDAD_VERSION,
          updated_at: now,
        },
        {
          onConflict: "user_id",
        }
      );

    if (error) {
      console.error("Error guardando datos bancarios:", error);

      return NextResponse.json(
        { error: "No fue posible guardar los datos bancarios" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Error POST datos bancarios:", error);

    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}