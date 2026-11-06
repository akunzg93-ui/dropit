import { createClient } from "@supabase/supabase-js";
import { getPacProvider } from "@/lib/billing/pac/factory";
import {
  parseCfdiXml,
  validarCfdiContraOperacion,
} from "@/lib/billing/cfdi";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function validateEstablishmentCfdi(params: {
  invoiceRequestId: string;
  establecimientoUserId: string;
}) {
  const { invoiceRequestId, establecimientoUserId } = params;
  const supabase = getAdminClient();

  // =====================================================
  // 1. Invoice Request
  // =====================================================

  const {
    data: invoiceRequest,
    error: requestError,
  } = await supabase
    .from("invoice_requests")
    .select("id, pedido_id, estado, fiscal_data_snapshot")
    .eq("id", invoiceRequestId)
    .single();

  if (requestError || !invoiceRequest) {
    throw new Error("INVOICE_REQUEST_NOT_FOUND");
  }

  // =====================================================
  // 2. Pedido
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
    throw new Error("ORDER_NOT_FOUND");
  }

  // =====================================================
  // 3. Establecimiento
  // =====================================================

  const {
    data: establecimiento,
    error: establecimientoError,
  } = await supabase
    .from("establecimientos")
    .select("id, usuario_id, fiscal_profile_id")
    .eq("uuid", pedido.establecimiento_uuid)
    .single();

  if (establecimientoError || !establecimiento) {
    throw new Error("ESTABLISHMENT_NOT_FOUND");
  }

  if (establecimiento.usuario_id !== establecimientoUserId) {
    throw new Error("FORBIDDEN");
  }

  if (!establecimiento.fiscal_profile_id) {
    throw new Error("ESTABLISHMENT_FISCAL_PROFILE_MISSING");
  }

  // =====================================================
  // 4. Perfil fiscal
  // =====================================================

  const {
    data: perfilEstablecimiento,
    error: perfilError,
  } = await supabase
    .from("fiscal_profiles")
    .select("id, user_id, rfc, razon_social, activo")
    .eq("id", establecimiento.fiscal_profile_id)
    .eq("user_id", establecimientoUserId)
    .eq("activo", true)
    .single();

  if (perfilError || !perfilEstablecimiento) {
    throw new Error("ESTABLISHMENT_FISCAL_PROFILE_INVALID");
  }

  // =====================================================
  // 5. Invoice establecimiento
  // =====================================================

  const { data: invoice, error: invoiceError } =
    await supabase
      .from("invoices")
      .select("id, estado, xml_path, pdf_path")
      .eq("invoice_request_id", invoiceRequestId)
      .eq("tipo_emisor", "establecimiento")
      .single();

  if (invoiceError || !invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  if (!invoice.xml_path) {
    throw new Error("XML_NOT_UPLOADED");
  }

  if (
    invoice.estado !== "pendiente" &&
    invoice.estado !== "error"
  ) {
    throw new Error("INVOICE_NOT_VALIDATABLE");
  }

  // =====================================================
  // 6. Movimiento financiero
  // =====================================================

  const {
    data: balanceMovimiento,
    error: balanceError,
  } = await supabase
    .from("balance_movimientos")
    .select("id, monto_bruto, status")
    .eq("pedido_id", invoiceRequest.pedido_id)
    .single();

  if (balanceError || !balanceMovimiento) {
    throw new Error("BALANCE_MOVEMENT_NOT_FOUND");
  }

  // =====================================================
  // 7. RFC receptor
  // =====================================================

  const snapshot = invoiceRequest.fiscal_data_snapshot;
  const rfcVendedor = snapshot?.rfc;

  if (!rfcVendedor) {
    throw new Error("FISCAL_SNAPSHOT_INVALID");
  }

  // =====================================================
  // 8. Reclamar validación
  // =====================================================

  const {
    data: token,
    error: claimError,
  } = await supabase.rpc(
    "reclamar_validacion_cfdi_establecimiento",
    {
      p_invoice_id: invoice.id,
    }
  );

  if (claimError || !token) {
    console.error(
      "Error reclamando validación CFDI:",
      claimError
    );

    throw new Error("CFDI_VALIDATION_CLAIM_FAILED");
  }

  const validationToken = String(token);

  // =====================================================
  // Funciones auxiliares protegidas por token
  // =====================================================

  async function ejecutarRpc(
    nombre: string,
    argumentos: Record<string, unknown>
  ) {
    const { data, error } = await supabase.rpc(
      nombre,
      argumentos
    );

    if (error || data !== true) {
      console.error(`Error ejecutando ${nombre}:`, error);
      throw new Error("CFDI_VALIDATION_TOKEN_LOST");
    }
  }

  async function liberarValidacion(mensaje: string) {
    await ejecutarRpc(
      "liberar_validacion_cfdi_establecimiento",
      {
        p_invoice_id: invoice.id,
        p_token: validationToken,
        p_error_mensaje: mensaje,
      }
    );
  }

  // =====================================================
  // 9. Procesamiento protegido
  // =====================================================

  let finalizada = false;

  try {
    // Volver a consultar el XML después de reclamar.
    const {
      data: invoiceReclamada,
      error: refreshError,
    } = await supabase
      .from("invoices")
      .select("xml_path, estado, validacion_token")
      .eq("id", invoice.id)
      .single();

    if (
      refreshError ||
      !invoiceReclamada ||
      invoiceReclamada.estado !== "procesando" ||
      invoiceReclamada.validacion_token !== validationToken ||
      !invoiceReclamada.xml_path
    ) {
      throw new Error("CFDI_VALIDATION_TOKEN_LOST");
    }

    // ===================================================
    // 10. Descargar XML
    // ===================================================

    const {
      data: xmlFile,
      error: downloadError,
    } = await supabase.storage
      .from("billing-documents")
      .download(invoiceReclamada.xml_path);

    if (downloadError || !xmlFile) {
      throw new Error("XML_DOWNLOAD_ERROR");
    }

    const xmlText = await xmlFile.text();

    // ===================================================
    // 11. Parsear CFDI
    // ===================================================

    const parsed = parseCfdiXml(xmlText);

    if (!parsed.valid || !parsed.data) {
      await liberarValidacion(
        parsed.errors.join(" | ")
      );

      finalizada = true;

      return {
        valid: false,
        stage: "local",
        errors: parsed.errors,
      };
    }

    // ===================================================
    // 12. Validación contra operación
    // ===================================================

    const validation = validarCfdiContraOperacion({
      cfdi: parsed.data,
      rfcEstablecimiento: perfilEstablecimiento.rfc,
      rfcVendedor,
      totalEsperado: Number(
        balanceMovimiento.monto_bruto
      ),
    });

    if (!validation.valid) {
      await liberarValidacion(
        validation.errors.join(" | ")
      );

      finalizada = true;

      return {
        valid: false,
        stage: "local",
        errors: validation.errors,
      };
    }

    // ===================================================
    // 13. Guardar datos fiscales
    // ===================================================

    await ejecutarRpc(
  "guardar_datos_cfdi_establecimiento",
  {
    p_invoice_id: invoice.id,
    p_token: validationToken,
    p_uuid_fiscal: parsed.data.uuid,
    p_subtotal: parsed.data.subtotal,
    p_total: parsed.data.total,
    p_fecha_emision: parsed.data.fecha,

    // Datos adicionales del CFDI
    p_serie: parsed.data.serie ?? null,
    p_folio: parsed.data.folio ?? null,
    p_impuestos: parsed.data.impuestos,
  }
);

    // ===================================================
    // 14. Validación fiscal PAC / SAT
    // ===================================================

    const pac = getPacProvider();

    let pacValidation;

    try {
      pacValidation = await pac.validateCfdi(xmlText);
    } catch (error) {
      console.error(
        "Error consultando PAC:",
        error
      );

      const mensaje =
        "No fue posible validar fiscalmente el CFDI";

      await liberarValidacion(mensaje);

      finalizada = true;

      return {
        valid: false,
        stage: "pac",
        errors: [mensaje],
      };
    }

    // ===================================================
    // 15. CFDI rechazado por PAC
    // ===================================================

    if (!pacValidation.valid) {
      const errors =
        pacValidation.errors.length > 0
          ? pacValidation.errors
          : ["El CFDI no pasó la validación fiscal"];

      await liberarValidacion(
        errors.join(" | ")
      );

      finalizada = true;

      return {
        valid: false,
        stage: "pac",
        errors,
      };
    }

    // ===================================================
    // 16. Finalizar validación
    // ===================================================

    await ejecutarRpc(
      "finalizar_validacion_cfdi_establecimiento",
      {
        p_invoice_id: invoice.id,
        p_token: validationToken,
      }
    );

    finalizada = true;

    return {
      valid: true,
      stage: "pac",
      invoiceId: invoice.id,
      cfdi: {
        uuid: parsed.data.uuid,
        rfcEmisor: parsed.data.rfcEmisor,
        rfcReceptor: parsed.data.rfcReceptor,
        subtotal: parsed.data.subtotal,
        total: parsed.data.total,
        fecha: parsed.data.fecha,
      },
    };
  } catch (error) {
    // Si la validación perdió el token, no debe
    // modificar el estado de otro proceso.
    if (
      error instanceof Error &&
      error.message === "CFDI_VALIDATION_TOKEN_LOST"
    ) {
      throw error;
    }

    // Intentar liberar el token ante errores inesperados.
    if (!finalizada) {
      try {
        await liberarValidacion(
          error instanceof Error
            ? error.message
            : "Error inesperado durante la validación"
        );
      } catch (releaseError) {
        console.error(
          "No fue posible liberar validación CFDI:",
          releaseError
        );
      }
    }

    throw error;
  }
}