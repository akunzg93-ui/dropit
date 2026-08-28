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
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const user = await getBillingUser(req);
    const supabase = getAdminClient();

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Factura requerida",
        },
        { status: 400 }
      );
    }

    const { searchParams } =
      new URL(req.url);

    const formato =
      searchParams.get("format") ||
      "xml";

    if (
      formato !== "xml" &&
      formato !== "pdf"
    ) {
      return NextResponse.json(
        {
          error:
            "Formato de descarga no válido",
        },
        { status: 400 }
      );
    }

    // ==================================================
    // 1. Invoice + solicitud
    // ==================================================

    const {
      data: invoice,
      error: invoiceError,
    } = await supabase
      .from("invoices")
      .select(`
        id,
        tipo_emisor,
        estado,
        uuid_fiscal,
        folio,
        xml_path,
        pdf_path,

        invoice_requests!inner (
          id,
          vendedor_id,
          pedido_id
        )
      `)
      .eq("id", id)
      .eq(
        "invoice_requests.vendedor_id",
        user.id
      )
      .single();

    if (
      invoiceError ||
      !invoice
    ) {
      return NextResponse.json(
        {
          error:
            "Factura no encontrada",
        },
        { status: 404 }
      );
    }

    if (
      invoice.estado !== "emitida"
    ) {
      return NextResponse.json(
        {
          error:
            "La factura todavía no está disponible",
        },
        { status: 409 }
      );
    }

    // ==================================================
    // 2. Elegir documento
    // ==================================================

    const path =
      formato === "pdf"
        ? invoice.pdf_path
        : invoice.xml_path;

    if (!path) {
      return NextResponse.json(
        {
          error:
            formato === "pdf"
              ? "El PDF todavía no está disponible"
              : "El XML todavía no está disponible",
        },
        { status: 404 }
      );
    }

    // ==================================================
    // 3. Descargar del bucket privado
    // ==================================================

    const {
      data: file,
      error: downloadError,
    } = await supabase.storage
      .from("billing-documents")
      .download(path);

    if (
      downloadError ||
      !file
    ) {
      console.error(
        "Error descargando documento:",
        downloadError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo descargar el documento",
        },
        { status: 500 }
      );
    }

    // ==================================================
    // 4. Respuesta binaria
    // ==================================================

    const buffer =
      await file.arrayBuffer();

    const extension =
      formato === "pdf"
        ? "pdf"
        : "xml";

    const contentType =
      formato === "pdf"
        ? "application/pdf"
        : "application/xml";

    const filename =
      `factura-${
        invoice.folio ||
        invoice.uuid_fiscal ||
        invoice.id
      }.${extension}`;

    return new Response(
      buffer,
      {
        status: 200,

        headers: {
          "Content-Type":
            contentType,

          "Content-Disposition":
            `attachment; filename="${filename}"`,

          "Cache-Control":
            "private, no-store",
        },
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "UNAUTHORIZED"
    ) {
      return NextResponse.json(
        {
          error: "No autorizado",
        },
        { status: 401 }
      );
    }

    console.error(
      "Error descargando invoice:",
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