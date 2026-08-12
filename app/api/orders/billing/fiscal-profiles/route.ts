import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: Request) {
  try {
    const user = await getBillingUser(req);

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("fiscal_profiles")
      .select(`
        id,
        nombre_perfil,
        rfc,
        razon_social,
        codigo_postal,
        regimen_fiscal,
        uso_cfdi,
        email,
        es_predeterminado,
        activo,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .eq("activo", true)
      .order("es_predeterminado", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error obteniendo perfiles fiscales:", error);

      return NextResponse.json(
        { error: "No se pudieron obtener los perfiles fiscales" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profiles: data ?? [],
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    console.error("Error GET fiscal profiles:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getBillingUser(req);

    const body = await req.json();

    const {
      nombre_perfil,
      rfc,
      razon_social,
      codigo_postal,
      regimen_fiscal,
      uso_cfdi,
      email,
      es_predeterminado = false,
    } = body;

    if (
      !nombre_perfil ||
      !rfc ||
      !razon_social ||
      !codigo_postal ||
      !regimen_fiscal ||
      !uso_cfdi ||
      !email
    ) {
      return NextResponse.json(
        { error: "Todos los datos fiscales son obligatorios" },
        { status: 400 }
      );
    }

    const codigoPostal = String(codigo_postal).trim();

    if (!/^\d{5}$/.test(codigoPostal)) {
      return NextResponse.json(
        { error: "Código postal fiscal inválido" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: perfilesExistentes, error: perfilesError } =
      await supabase
        .from("fiscal_profiles")
        .select("id, es_predeterminado")
        .eq("user_id", user.id)
        .eq("activo", true);

    if (perfilesError) {
      console.error(
        "Error validando perfiles existentes:",
        perfilesError
      );

      return NextResponse.json(
        { error: "No se pudo validar el perfil fiscal" },
        { status: 500 }
      );
    }

    const esPrimerPerfil =
      !perfilesExistentes || perfilesExistentes.length === 0;

    const debeSerPredeterminado =
      esPrimerPerfil || Boolean(es_predeterminado);

    if (debeSerPredeterminado && !esPrimerPerfil) {
      const { error: resetError } = await supabase
        .from("fiscal_profiles")
        .update({ es_predeterminado: false })
        .eq("user_id", user.id)
        .eq("activo", true)
        .eq("es_predeterminado", true);

      if (resetError) {
        console.error(
          "Error actualizando perfil predeterminado:",
          resetError
        );

        return NextResponse.json(
          { error: "No se pudo actualizar el perfil predeterminado" },
          { status: 500 }
        );
      }
    }

    const { data, error } = await supabase
      .from("fiscal_profiles")
      .insert({
        user_id: user.id,
        nombre_perfil: String(nombre_perfil).trim(),
        rfc: String(rfc).trim().toUpperCase(),
        razon_social: String(razon_social).trim(),
        codigo_postal: codigoPostal,
        regimen_fiscal: String(regimen_fiscal).trim(),
        uso_cfdi: String(uso_cfdi).trim(),
        email: String(email).trim().toLowerCase(),
        es_predeterminado: debeSerPredeterminado,
        activo: true,
      })
      .select(`
        id,
        nombre_perfil,
        rfc,
        razon_social,
        codigo_postal,
        regimen_fiscal,
        uso_cfdi,
        email,
        es_predeterminado,
        activo,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error("Error creando perfil fiscal:", error);

      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Ya existe un perfil fiscal activo con ese RFC",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "No se pudo crear el perfil fiscal" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        profile: data,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    console.error("Error POST fiscal profiles:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}