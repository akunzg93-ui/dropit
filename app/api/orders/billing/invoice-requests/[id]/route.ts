import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getBillingUser } from "@/lib/billing/auth";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getBillingUser(req);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Solicitud requerida" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("invoice_requests")
      .select(`
        id,
        pedido_id,
        vendedor_id,
        fiscal_profile_id,
        estado,
        fiscal_data_snapshot,
        fecha_solicitud,
        fecha_limite,
        fecha_completada,
        motivo_rechazo,
        created_at,
        updated_at,

        pedidos (
          id,
          folio,
          estado,
          recibido_en,
          establecimiento_id,
          establecimiento_uuid
        ),

        fiscal_profiles (
          id,
          nombre_perfil
        ),

        invoices (
          id,
          tipo_emisor,
          emisor_id,
          estado,
          uuid_fiscal,
          serie,
          folio,
          subtotal,
          impuestos,
          total,
          xml_path,
          pdf_path,
          fecha_emision,
          fecha_cancelacion,
          error_mensaje,
          created_at,
          updated_at
        ),

        settlements (
          id,
          estado,
          importe_servicio,
          comision_dropit,
          importe_establecimiento,
          requiere_factura,
          bloqueo_motivo,
          fecha_elegible_pago,
          fecha_liberacion,
          fecha_pago
        )
      `)
      .eq("id", id)
      .eq("vendedor_id", user.id)
      .single();

    if (error || !data) {
      if (error?.code !== "PGRST116") {
        console.error(
          "Error obteniendo solicitud de factura:",
          error
        );
      }

      return NextResponse.json(
        { error: "Solicitud de factura no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      invoice_request: data,
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

    console.error(
      "Error GET invoice request detail:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}