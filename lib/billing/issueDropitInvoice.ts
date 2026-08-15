import { createClient } from "@supabase/supabase-js";

import { buildDropitInvoice } from "@/lib/billing/buildDropitInvoice";
import { getOrderPaymentData } from "@/lib/billing/getOrderPaymentData";
import { parseCfdiXml } from "@/lib/billing/cfdi";

import type { PacProvider } from "@/lib/billing/pac/provider";

type FiscalSnapshot = {
  rfc: string;
  razon_social: string;
  codigo_postal: string;
  regimen_fiscal: string;
  uso_cfdi: string;
  email?: string;
};

type IssueDropitInvoiceParams = {
  pedidoId: number;
  vendedorId: string;
  pac: PacProvider;
};

export type IssueDropitInvoiceResult = {
  invoiceId: string;
  invoiceRequestId: string;

  uuid: string;

  serie: string;
  folio: string;

  subtotal: number;
  impuestos: number;
  total: number;

  xmlPath: string;

  fechaEmision: string;
};

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizarRFC(
  value?: string | null
) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isFiscalSnapshot(
  value: unknown
): value is FiscalSnapshot {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Record<string, unknown>;

  return Boolean(
    data.rfc &&
      data.razon_social &&
      data.codigo_postal &&
      data.regimen_fiscal &&
      data.uso_cfdi
  );
}

function importesCoinciden(
  a: number,
  b: number
) {
  return Math.abs(a - b) <= 0.01;
}

async function marcarInvoiceError(
  invoiceId: string,
  mensaje: string
) {
  const supabase =
    getAdminClient();

  const { error } =
    await supabase
      .from("invoices")
      .update({
        estado: "error",
        error_mensaje:
          mensaje.slice(0, 1000),
      })
      .eq("id", invoiceId);

  if (error) {
    console.error(
      "Error marcando invoice como error:",
      error
    );
  }
}

export async function issueDropitInvoice({
  pedidoId,
  vendedorId,
  pac,
}: IssueDropitInvoiceParams): Promise<IssueDropitInvoiceResult> {
  if (
    !Number.isInteger(pedidoId) ||
    pedidoId <= 0
  ) {
    throw new Error(
      "PEDIDO_ID_INVALID"
    );
  }

  if (!vendedorId) {
    throw new Error(
      "VENDEDOR_ID_REQUIRED"
    );
  }

  const supabase =
    getAdminClient();

  // =====================================================
  // 1. Invoice Request
  // =====================================================

  const {
    data: invoiceRequest,
    error: requestError,
  } = await supabase
    .from("invoice_requests")
    .select(`
      id,
      pedido_id,
      vendedor_id,
      estado,
      fiscal_data_snapshot
    `)
    .eq("pedido_id", pedidoId)
    .eq("vendedor_id", vendedorId)
    .single();

  if (
    requestError ||
    !invoiceRequest
  ) {
    throw new Error(
      "INVOICE_REQUEST_NOT_FOUND"
    );
  }

  if (
    !isFiscalSnapshot(
      invoiceRequest
        .fiscal_data_snapshot
    )
  ) {
    throw new Error(
      "FISCAL_SNAPSHOT_INVALID"
    );
  }

  // =====================================================
  // 2. Invoice Dropit existente
  // =====================================================

  const {
    data: invoice,
    error: invoiceError,
  } = await supabase
    .from("invoices")
    .select(`
      id,
      estado,
      uuid_fiscal,
      xml_path
    `)
    .eq(
      "invoice_request_id",
      invoiceRequest.id
    )
    .eq("tipo_emisor", "dropit")
    .single();

  if (
    invoiceError ||
    !invoice
  ) {
    throw new Error(
      "DROPIT_INVOICE_NOT_FOUND"
    );
  }

  /*
    Si ya existe UUID, bajo ninguna
    circunstancia volvemos a timbrar.
  */
  if (invoice.uuid_fiscal) {
    throw new Error(
      "DROPIT_INVOICE_ALREADY_STAMPED"
    );
  }

  if (
    invoice.estado ===
      "cancelada" ||
    invoice.estado ===
      "cancelacion_pendiente"
  ) {
    throw new Error(
      "DROPIT_INVOICE_NOT_ISSUABLE"
    );
  }

  // =====================================================
  // 3. Tomar control del invoice
  //
  // Evita que dos requests simultáneos intenten
  // timbrar la misma factura.
  // =====================================================

  const {
    data: claimedInvoice,
    error: claimError,
  } = await supabase
    .from("invoices")
    .update({
      estado: "procesando",
      error_mensaje: null,
    })
    .eq("id", invoice.id)
    .in(
      "estado",
      [
        "pendiente",
        "error",
      ]
    )
    .is(
      "uuid_fiscal",
      null
    )
    .select("id")
    .maybeSingle();

  if (claimError) {
    console.error(
      "Error tomando control de invoice:",
      claimError
    );

    throw new Error(
      "DROPIT_INVOICE_CLAIM_ERROR"
    );
  }

  if (!claimedInvoice) {
    throw new Error(
      "DROPIT_INVOICE_ALREADY_PROCESSING"
    );
  }

  try {
    // ===================================================
    // 4. Pedido
    // ===================================================

    const {
      data: pedido,
      error: pedidoError,
    } = await supabase
      .from("pedidos")
      .select(`
        id,
        folio,
        vendedor_id
      `)
      .eq("id", pedidoId)
      .eq(
        "vendedor_id",
        vendedorId
      )
      .single();

    if (
      pedidoError ||
      !pedido
    ) {
      throw new Error(
        "ORDER_NOT_FOUND"
      );
    }

    // ===================================================
    // 5. Comisión Dropit
    // ===================================================

    const {
      data: balance,
      error: balanceError,
    } = await supabase
      .from(
        "balance_movimientos"
      )
      .select(`
        comision_monto,
        iva_monto,
        moneda
      `)
      .eq(
        "pedido_id",
        pedidoId
      )
      .single();

    if (
      balanceError ||
      !balance
    ) {
      throw new Error(
        "ORDER_BALANCE_NOT_FOUND"
      );
    }

    const moneda =
      String(
        balance.moneda ||
          ""
      ).toUpperCase();

    if (moneda !== "MXN") {
      throw new Error(
        "UNSUPPORTED_CURRENCY"
      );
    }

    // ===================================================
    // 6. Forma de pago real
    //
    // pedido
    // → coin_movimientos
    // → coin_lotes
    // → pagos
    // ===================================================

    const payment =
      await getOrderPaymentData(
        pedidoId
      );

    // ===================================================
    // 7. Construir CFDI
    // ===================================================

    const cfdi =
      buildDropitInvoice({
        pedido: {
          folio:
            pedido.folio,
        },

        fiscalProfile:
          invoiceRequest
            .fiscal_data_snapshot,

        settlement: {
          comision_monto:
            Number(
              balance
                .comision_monto
            ),

          iva_monto:
            Number(
              balance
                .iva_monto
            ),

          moneda,
        },
      });

    // ===================================================
    // 8. Timbrar con PAC
    // ===================================================

    const issued =
      await pac.issueInvoice(
        cfdi,
        {
          formaPago:
            payment.formaPago,

          metodoPago:
            payment.metodoPago,
        }
      );

    if (
      !issued.uuid ||
      !issued.xml
    ) {
      throw new Error(
        "PAC_RESPONSE_INCOMPLETE"
      );
    }

    // ===================================================
    // 9. Parsear XML devuelto
    // ===================================================

    const parsed =
      parseCfdiXml(
        issued.xml
      );

    if (
      !parsed.valid ||
      !parsed.data
    ) {
      throw new Error(
        `PAC_XML_INVALID:${
          parsed.errors.join(
            " | "
          )
        }`
      );
    }

    // ===================================================
    // 10. Validaciones del XML contra lo que pedimos
    // ===================================================

    if (
      parsed.data.uuid
        .toUpperCase() !==
      issued.uuid.toUpperCase()
    ) {
      throw new Error(
        "PAC_UUID_MISMATCH"
      );
    }

    if (
      normalizarRFC(
        parsed.data.rfcEmisor
      ) !==
      normalizarRFC(
        cfdi.emisor.rfc
      )
    ) {
      throw new Error(
        "PAC_ISSUER_RFC_MISMATCH"
      );
    }

    if (
      normalizarRFC(
        parsed.data.rfcReceptor
      ) !==
      normalizarRFC(
        cfdi.receptor.rfc
      )
    ) {
      throw new Error(
        "PAC_RECEIVER_RFC_MISMATCH"
      );
    }

    if (
      !importesCoinciden(
        parsed.data.subtotal,
        cfdi.subtotal
      )
    ) {
      throw new Error(
        "PAC_SUBTOTAL_MISMATCH"
      );
    }

    if (
      !importesCoinciden(
        parsed.data.total,
        cfdi.total
      )
    ) {
      throw new Error(
        "PAC_TOTAL_MISMATCH"
      );
    }

    // ===================================================
    // 11. Registrar inmediatamente que ya fue timbrada
    //
    // Esto ocurre ANTES de Storage.
    //
    // Si Storage falla, conservamos el UUID en BD y
    // evitamos timbrar nuevamente por accidente.
    // ===================================================

    const {
      error: stampUpdateError,
    } = await supabase
      .from("invoices")
      .update({
        uuid_fiscal:
          issued.uuid
            .toUpperCase(),

        serie:
          cfdi.serie,

        folio:
          cfdi.folio,

        subtotal:
          cfdi.subtotal,

        impuestos:
          cfdi.impuestos
            .totalTrasladados,

        total:
          cfdi.total,

        fecha_emision:
          parsed.data.fecha,

        error_mensaje:
          null,
      })
      .eq("id", invoice.id);

    if (stampUpdateError) {
      console.error(
        "Error registrando UUID del CFDI:",
        stampUpdateError
      );

      /*
        IMPORTANTE:
        En este punto SW YA TIMBRÓ.

        No permitimos volver a llamar al PAC
        silenciosamente.
      */
      throw new Error(
        `STAMP_PERSISTENCE_ERROR:${issued.uuid}`
      );
    }

    // ===================================================
    // 12. Guardar XML timbrado
    // ===================================================

    const basePath =
      `${pedidoId}` +
      `/dropit/${invoiceRequest.id}`;

    const xmlPath =
      `${basePath}/factura.xml`;

    const xmlBuffer =
      Buffer.from(
        issued.xml,
        "utf8"
      );

    const {
      error: xmlUploadError,
    } = await supabase.storage
      .from(
        "billing-documents"
      )
      .upload(
        xmlPath,
        xmlBuffer,
        {
          contentType:
            "application/xml",

          upsert:
            true,
        }
      );

    if (xmlUploadError) {
      console.error(
        "Error guardando XML Dropit:",
        xmlUploadError
      );

      await marcarInvoiceError(
        invoice.id,
        `XML_STORAGE_ERROR_AFTER_STAMP:${issued.uuid}`
      );

      throw new Error(
        `XML_STORAGE_ERROR_AFTER_STAMP:${issued.uuid}`
      );
    }

    // ===================================================
    // 13. Marcar invoice emitida
    // ===================================================

    const {
      error: finalUpdateError,
    } = await supabase
      .from("invoices")
      .update({
        estado:
          "emitida",

        xml_path:
          xmlPath,

        /*
          Por ahora no generamos PDF.
        */
        pdf_path:
          null,

        error_mensaje:
          null,
      })
      .eq("id", invoice.id);

    if (finalUpdateError) {
      console.error(
        "Error finalizando invoice Dropit:",
        finalUpdateError
      );

      await marcarInvoiceError(
        invoice.id,
        `INVOICE_FINALIZE_ERROR_AFTER_STAMP:${issued.uuid}`
      );

      throw new Error(
        `INVOICE_FINALIZE_ERROR_AFTER_STAMP:${issued.uuid}`
      );
    }

    // ===================================================
    // 14. Resultado
    // ===================================================

    return {
      invoiceId:
        invoice.id,

      invoiceRequestId:
        invoiceRequest.id,

      uuid:
        issued.uuid
          .toUpperCase(),

      serie:
        cfdi.serie,

      folio:
        cfdi.folio,

      subtotal:
        cfdi.subtotal,

      impuestos:
        cfdi.impuestos
          .totalTrasladados,

      total:
        cfdi.total,

      xmlPath,

      fechaEmision:
        parsed.data.fecha,
    };
  } catch (error) {
    /*
      Si todavía NO existe UUID, el timbrado no quedó
      registrado como exitoso y podemos dejar estado error.

      Si SW ya timbró y alcanzamos a persistir UUID,
      marcarInvoiceError conserva ese UUID y evita
      un segundo timbrado accidental.
    */

    const {
      data: currentInvoice,
    } = await supabase
      .from("invoices")
      .select(`
        uuid_fiscal
      `)
      .eq(
        "id",
        invoice.id
      )
      .maybeSingle();

    const mensaje =
      error instanceof Error
        ? error.message
        : "DROPIT_INVOICE_UNKNOWN_ERROR";

    if (
      !currentInvoice
        ?.uuid_fiscal
    ) {
      await marcarInvoiceError(
        invoice.id,
        mensaje
      );
    }

    throw error;
  }
}