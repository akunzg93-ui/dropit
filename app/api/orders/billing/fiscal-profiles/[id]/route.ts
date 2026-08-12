import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getBillingUser(req);
    const { id } = await context.params;
    const body = await req.json();

    const supabase = getAdminClient();

    const { data: perfilActual, error: perfilError } = await supabase
      .from("fiscal_profiles")
      .select("id, user_id, es_predeterminado, activo")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (perfilError || !perfilActual) {
      return NextResponse.json(
        { error: "Perfil fiscal no encontrado" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.nombre_perfil !== undefined) {
      updates.nombre_perfil = String(body.nombre_perfil).trim();
    }

    if (body.rfc !== undefined) {
      updates.rfc = String(body.rfc).trim().toUpperCase();
    }

    if (body.razon_social !== undefined) {
      updates.razon_social = String(body.razon_social).trim();
    }

    if (body.codigo_postal !== undefined) {
      const codigoPostal = String(body.codigo_postal).trim();

      if (!/^\d{5}$/.test(codigoPostal)) {
        return NextResponse.json(
          { error: "Código postal fiscal inválido" },
          { status: 400 }
        );
      }

      updates.codigo_postal = codigoPostal;
    }

    if (body.regimen_fiscal !== undefined) {
      updates.regimen_fiscal = String(body.regimen_fiscal).trim();
    }

    if (body.uso_cfdi !== undefined) {
      updates.uso_cfdi = String(body.uso_cfdi).trim();
    }

    if (body.email !== undefined) {
      updates.email = String(body.email).trim().toLowerCase();
    }

    if (body.activo !== undefined) {
      updates.activo = Boolean(body.activo);
    }

    if (body.es_predeterminado === true) {
      const { error: resetError } = await supabase
        .from("fiscal_profiles")
        .update({ es_predeterminado: false })
        .eq("user_id", user.id)
        .eq("activo", true)
        .eq("es_predeterminado", true);

      if (resetError) {
        console.error(
          "Error quitando perfil predeterminado anterior:",
          resetError
        );

        return NextResponse.json(
          { error: "No se pudo actualizar el perfil predeterminado" },
          { status: 500 }
        );
      }

      updates.es_predeterminado = true;
      updates.activo = true;
    }

    if (
      body.activo === false &&
      perfilActual.es_predeterminado
    ) {
      updates.es_predeterminado = false;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No hay cambios para aplicar" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("fiscal_profiles")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
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
      console.error("Error actualizando perfil fiscal:", error);

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
        { error: "No se pudo actualizar el perfil fiscal" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: data,
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

    console.error("Error PATCH fiscal profile:", error);

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}