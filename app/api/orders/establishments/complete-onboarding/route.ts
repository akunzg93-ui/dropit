import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    // =====================================================
    // 1. Usuario autenticado
    // =====================================================

    const user =
      await getBillingUser(req);

    const {
      establecimiento_id,
      fiscal_profile_id,
    } = await req.json();

    const establecimientoId =
      Number(establecimiento_id);

    if (
      !Number.isInteger(establecimientoId) ||
      establecimientoId <= 0 ||
      !fiscal_profile_id
    ) {
      return NextResponse.json(
        {
          error:
            "Establecimiento y perfil fiscal son obligatorios",
        },
        { status: 400 }
      );
    }

    const supabase =
      getAdminClient();

    // =====================================================
    // 2. Validar establecimiento y propietario
    // =====================================================

    const {
      data: establecimiento,
      error: establecimientoError,
    } = await supabase
      .from("establecimientos")
      .select(`
        id,
        usuario_id,
        nombre,
        direccion,
        cp,
        lat,
        lng,
        capacidad_small,
        capacidad_medium,
        activo,
        fiscal_profile_id
      `)
      .eq(
        "id",
        establecimientoId
      )
      .eq(
        "usuario_id",
        user.id
      )
      .single();

    if (
      establecimientoError ||
      !establecimiento
    ) {
      return NextResponse.json(
        {
          error:
            "Establecimiento no encontrado",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 3. Confirmar datos operativos mínimos
    // =====================================================

    if (
      !establecimiento.nombre ||
      !establecimiento.direccion ||
      !establecimiento.cp ||
      establecimiento.lat == null ||
      establecimiento.lng == null ||
      establecimiento.capacidad_small == null ||
      establecimiento.capacidad_medium == null
    ) {
      return NextResponse.json(
        {
          error:
            "Completa primero la información operativa del establecimiento",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 4. Validar perfil fiscal
    //
    // Debe pertenecer al MISMO usuario y estar activo.
    // =====================================================

    const {
      data: fiscalProfile,
      error: fiscalProfileError,
    } = await supabase
      .from("fiscal_profiles")
      .select(`
        id,
        user_id,
        rfc,
        razon_social,
        codigo_postal,
        regimen_fiscal,
        uso_cfdi,
        email,
        activo
      `)
      .eq(
        "id",
        fiscal_profile_id
      )
      .eq(
        "user_id",
        user.id
      )
      .eq(
        "activo",
        true
      )
      .single();

    if (
      fiscalProfileError ||
      !fiscalProfile
    ) {
      return NextResponse.json(
        {
          error:
            "Perfil fiscal no válido",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // 5. Validar datos fiscales mínimos
    // =====================================================

    if (
      !fiscalProfile.rfc ||
      !fiscalProfile.razon_social ||
      !fiscalProfile.codigo_postal ||
      !fiscalProfile.regimen_fiscal ||
      !fiscalProfile.uso_cfdi ||
      !fiscalProfile.email
    ) {
      return NextResponse.json(
        {
          error:
            "El perfil fiscal está incompleto",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 6. Vincular perfil fiscal
    // =====================================================

    const {
      data: actualizado,
      error: updateError,
    } = await supabase
      .from("establecimientos")
      .update({
  fiscal_profile_id:
    fiscalProfile.id,
})
      .eq(
        "id",
        establecimiento.id
      )
      .eq(
        "usuario_id",
        user.id
      )
      .select(`
  id,
  nombre,
  fiscal_profile_id
`)
      .single();

    if (
      updateError ||
      !actualizado
    ) {
      console.error(
        "Error completando onboarding:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo vincular el perfil fiscal",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,

      establishment: actualizado,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado",
        },
        { status: 401 }
      );
    }

    console.error(
      "Error complete establishment onboarding:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno",
      },
      { status: 500 }
    );
  }
}