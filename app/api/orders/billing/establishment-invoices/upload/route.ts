import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { getBillingUser } from "@/lib/billing/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: Request) {
  try {
    const user = await getBillingUser(req);
    const supabase = getAdminClient();

    const formData = await req.formData();

    const invoiceRequestId = String(
      formData.get("invoice_request_id") || ""
    );

    const xml = formData.get("xml");
    const pdf = formData.get("pdf");

    if (!invoiceRequestId) {
      return NextResponse.json(
        { error: "Solicitud de factura requerida" },
        { status: 400 }
      );
    }

    if (!(xml instanceof File) || !(pdf instanceof File)) {
      return NextResponse.json(
        { error: "XML y PDF son obligatorios" },
        { status: 400 }
      );
    }

    if (xml.size > MAX_FILE_SIZE || pdf.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Los archivos no pueden superar 5 MB" },
        { status: 400 }
      );
    }

    if (!xml.name.toLowerCase().endsWith(".xml")) {
      return NextResponse.json(
        { error: "El archivo XML no es válido" },
        { status: 400 }
      );
    }

    if (
      !pdf.name.toLowerCase().endsWith(".pdf") ||
      pdf.type !== "application/pdf"
    ) {
      return NextResponse.json(
        { error: "El archivo PDF no es válido" },
        { status: 400 }
      );
    }

    // =====================================================
    // 1. Obtener solicitud
    // =====================================================

    const { data: invoiceRequest, error: requestError } =
      await supabase
        .from("invoice_requests")
        .select("id, pedido_id, estado")
        .eq("id", invoiceRequestId)
        .single();

    if (requestError || !invoiceRequest) {
      return NextResponse.json(
        { error: "Solicitud de factura no encontrada" },
        { status: 404 }
      );
    }

    // =====================================================
    // 2. Obtener pedido
    // =====================================================

    const { data: pedido, error: pedidoError } =
      await supabase
        .from("pedidos")
        .select("id, establecimiento_uuid")
        .eq("id", invoiceRequest.pedido_id)
        .single();

    if (
      pedidoError ||
      !pedido ||
      !pedido.establecimiento_uuid
    ) {
      return NextResponse.json(
        { error: "Pedido o establecimiento no encontrado" },
        { status: 404 }
      );
    }

    // =====================================================
    // 3. Verificar propiedad del establecimiento
    // =====================================================

    const {
      data: establecimiento,
      error: establecimientoError,
    } = await supabase
      .from("establecimientos")
      .select("id, uuid, usuario_id, fiscal_profile_id")
      .eq("uuid", pedido.establecimiento_uuid)
      .eq("usuario_id", user.id)
      .single();

    if (establecimientoError || !establecimiento) {
      return NextResponse.json(
        { error: "No autorizado para esta factura" },
        { status: 403 }
      );
    }

    if (!establecimiento.fiscal_profile_id) {
      return NextResponse.json(
        {
          error:
            "Configura los datos fiscales del establecimiento antes de subir la factura",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 4. Obtener factura y versión actual
    // =====================================================

    const { data: invoice, error: invoiceError } =
      await supabase
        .from("invoices")
        .select("id, estado, updated_at")
        .eq("invoice_request_id", invoiceRequestId)
        .eq("tipo_emisor", "establecimiento")
        .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Factura del establecimiento no encontrada" },
        { status: 404 }
      );
    }

    // Solo se permite cargar o corregir documentos
    // antes de una validación exitosa.
    if (
      invoice.estado !== "pendiente" &&
      invoice.estado !== "error"
    ) {
      return NextResponse.json(
        {
          error:
            "La factura no admite nuevos documentos en su estado actual",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // 5. Generar rutas únicas por carga
    // =====================================================

    const uploadId = randomUUID();

    const basePath =
      `${invoiceRequest.pedido_id}` +
      `/establecimiento/${invoiceRequestId}/${uploadId}`;

    const xmlPath = `${basePath}/factura.xml`;
    const pdfPath = `${basePath}/factura.pdf`;

    // =====================================================
    // 6. Convertir archivos
    // =====================================================

    const xmlBuffer = Buffer.from(
      await xml.arrayBuffer()
    );

    const pdfBuffer = Buffer.from(
      await pdf.arrayBuffer()
    );

    // Limpia exclusivamente los archivos de esta carga.
    async function limpiarCarga() {
      const { error } = await supabase.storage
        .from("billing-documents")
        .remove([xmlPath, pdfPath]);

      if (error) {
        console.error(
          "Error limpiando documentos de carga fallida:",
          {
            invoiceId: invoice.id,
            uploadId,
            error,
          }
        );
      }
    }

    // =====================================================
    // 7. Subir XML
    // =====================================================

    const { error: xmlUploadError } =
      await supabase.storage
        .from("billing-documents")
        .upload(xmlPath, xmlBuffer, {
          contentType: xml.type || "application/xml",
          upsert: false,
        });

    if (xmlUploadError) {
      console.error(
        "Error subiendo XML:",
        xmlUploadError
      );

      return NextResponse.json(
        { error: "No se pudo guardar el XML" },
        { status: 500 }
      );
    }

    // =====================================================
    // 8. Subir PDF
    // =====================================================

    const { error: pdfUploadError } =
      await supabase.storage
        .from("billing-documents")
        .upload(pdfPath, pdfBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

    if (pdfUploadError) {
      console.error(
        "Error subiendo PDF:",
        pdfUploadError
      );

      await limpiarCarga();

      return NextResponse.json(
        { error: "No se pudo guardar el PDF" },
        { status: 500 }
      );
    }

    // =====================================================
    // 9. Registrar documentos de forma atómica
    // =====================================================

    const { error: registerError } =
      await supabase.rpc(
        "registrar_documentos_cfdi_establecimiento",
        {
          p_invoice_id: invoice.id,
          p_emisor_id: user.id,
          p_xml_path: xmlPath,
          p_pdf_path: pdfPath,
          p_updated_at_original: invoice.updated_at,
        }
      );

    if (registerError) {
      console.error(
        "Error registrando documentos CFDI:",
        registerError
      );

      // No borrar archivos de otras cargas.
      await limpiarCarga();

      if (
        registerError.message.includes(
          "CFDI_DOCUMENTOS_NO_PERMITIDOS_O_VERSION_CAMBIADA"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "La factura cambió mientras se cargaban los documentos. Actualiza la página e inténtalo nuevamente.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            "No se pudo registrar la factura",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // 10. Documentos registrados
    // =====================================================

    return NextResponse.json({
      ok: true,
      invoice_id: invoice.id,
      estado: "pendiente",
      message:
        "Documentos recibidos y pendientes de validación",
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
      "Error upload establishment invoice:",
      error
    );

    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}