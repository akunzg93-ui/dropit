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
  const {
    invoiceRequestId,
    establecimientoUserId,
  } = params;

  const supabase = getAdminClient();

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
      estado,
      fiscal_data_snapshot
    `)
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
    .select(`
      id,
      establecimiento_uuid
    `)
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
    .select(`
      id,
      usuario_id,
      fiscal_profile_id
    `)
    .eq("uuid", pedido.establecimiento_uuid)
    .single();

  if (
    establecimientoError ||
    !establecimiento
  ) {
    throw new Error("ESTABLISHMENT_NOT_FOUND");
  }

  if (
    establecimiento.usuario_id !==
    establecimientoUserId
  ) {
    throw new Error("FORBIDDEN");
  }

  if (!establecimiento.fiscal_profile_id) {
    throw new Error(
      "ESTABLISHMENT_FISCAL_PROFILE_MISSING"
    );
  }

  // =====================================================
  // 4. Perfil fiscal establecimiento
  // =====================================================

  const {
    data: perfilEstablecimiento,
    error: perfilError,
  } = await supabase
    .from("fiscal_profiles")
    .select(`
      id,
      user_id,
      rfc,
      razon_social,
      activo
    `)
    .eq(
      "id",
      establecimiento.fiscal_profile_id
    )
    .eq(
      "user_id",
      establecimientoUserId
    )
    .eq("activo", true)
    .single();

  if (perfilError || !perfilEstablecimiento) {
    throw new Error(
      "ESTABLISHMENT_FISCAL_PROFILE_INVALID"
    );
  }

  // =====================================================
  // 5. Invoice establecimiento
  // =====================================================

  const { data: invoice, error: invoiceError } =
    await supabase
      .from("invoices")
      .select(`
        id,
        estado,
        xml_path,
        pdf_path
      `)
      .eq(
        "invoice_request_id",
        invoiceRequestId
      )
      .eq("tipo_emisor", "establecimiento")
      .single();

  if (invoiceError || !invoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  if (!invoice.xml_path) {
    throw new Error("XML_NOT_UPLOADED");
  }

  if (
    invoice.estado === "emitida" ||
    invoice.estado === "cancelada"
  ) {
    throw new Error("INVOICE_NOT_VALIDATABLE");
  }

  // =====================================================
  // 6. Movimiento financiero del pedido
  // =====================================================

 const {
  data: balanceMovimiento,
  error: balanceError,
} = await supabase
  .from("balance_movimientos")
  .select(`
    id,
    monto_bruto,
    status
  `)
  .eq(
    "pedido_id",
    invoiceRequest.pedido_id
  )
  .single();

if (
  balanceError ||
  !balanceMovimiento
) {
  throw new Error(
    "BALANCE_MOVEMENT_NOT_FOUND"
  );
}
  // =====================================================
  // 7. RFC receptor desde Snapshot
  // =====================================================

  const snapshot =
    invoiceRequest.fiscal_data_snapshot;

  const rfcVendedor = snapshot?.rfc;

  if (!rfcVendedor) {
    throw new Error(
      "FISCAL_SNAPSHOT_INVALID"
    );
  }

  // =====================================================
  // 8. Descargar XML privado
  // =====================================================

  const {
    data: xmlFile,
    error: downloadError,
  } = await supabase.storage
    .from("billing-documents")
    .download(invoice.xml_path);

  if (downloadError || !xmlFile) {
    throw new Error("XML_DOWNLOAD_ERROR");
  }

  const xmlText = await xmlFile.text();

  // =====================================================
  // 9. Parsear CFDI
  // =====================================================

  const parsed = parseCfdiXml(xmlText);

  if (!parsed.valid || !parsed.data) {
    await supabase
      .from("invoices")
      .update({
        estado: "error",
        error_mensaje:
          parsed.errors.join(" | "),
      })
      .eq("id", invoice.id);

    return {
      valid: false,
      stage: "local",
      errors: parsed.errors,
    };
  }

  // =====================================================
  // 10. Validación contra operación
  // =====================================================

  const validation =
    validarCfdiContraOperacion({
      cfdi: parsed.data,

      rfcEstablecimiento:
        perfilEstablecimiento.rfc,

      rfcVendedor,

      totalEsperado: Number(
  balanceMovimiento.monto_bruto
),
    });

  if (!validation.valid) {
    await supabase
      .from("invoices")
      .update({
        estado: "error",
        error_mensaje:
          validation.errors.join(" | "),
      })
      .eq("id", invoice.id);

    return {
      valid: false,
      stage: "local",
      errors: validation.errors,
    };
  }

  // =====================================================
  // 11. Guardar datos obtenidos del CFDI
  // =====================================================

  const {
    error: updateError,
  } = await supabase
    .from("invoices")
    .update({
      estado: "procesando",

      uuid_fiscal:
        parsed.data.uuid,

      subtotal:
        parsed.data.subtotal,

      total:
        parsed.data.total,

      fecha_emision:
        parsed.data.fecha,

      error_mensaje: null,
    })
    .eq("id", invoice.id);

  if (updateError) {
    console.error(
      "Error guardando validación CFDI:",
      updateError
    );

    throw new Error(
      "INVOICE_UPDATE_ERROR"
    );
  }

   // =====================================================
  // 12. Validación fiscal con PAC / SAT
  // =====================================================

  const pac = getPacProvider();

  let pacValidation;

  try {
    pacValidation =
      await pac.validateCfdi(xmlText);
  } catch (error) {
    console.error(
      "Error consultando validación fiscal:",
      error
    );

    await supabase
      .from("invoices")
      .update({
        estado: "error",
        error_mensaje:
          "No fue posible validar fiscalmente el CFDI",
      })
      .eq("id", invoice.id);

    return {
      valid: false,
      stage: "pac",
      errors: [
        "No fue posible validar fiscalmente el CFDI",
      ],
    };
  }

  // =====================================================
  // 13. CFDI rechazado fiscalmente
  // =====================================================

  if (!pacValidation.valid) {
    const errors =
      pacValidation.errors.length > 0
        ? pacValidation.errors
        : [
            "El CFDI no pasó la validación fiscal",
          ];

    await supabase
      .from("invoices")
      .update({
        estado: "error",
        error_mensaje:
          errors.join(" | "),
      })
      .eq("id", invoice.id);

    return {
      valid: false,
      stage: "pac",
      errors,
    };
  }

  // =====================================================
  // 14. CFDI válido → emitida
  // =====================================================

  const {
    error: emitidaError,
  } = await supabase
    .from("invoices")
    .update({
      estado: "emitida",
      error_mensaje: null,
    })
    .eq("id", invoice.id);

  if (emitidaError) {
    console.error(
      "Error marcando CFDI como emitido:",
      emitidaError
    );

    throw new Error(
      "INVOICE_UPDATE_ERROR"
    );
  }

  return {
    valid: true,
    stage: "pac",

    invoiceId: invoice.id,

    cfdi: {
      uuid: parsed.data.uuid,
      rfcEmisor:
        parsed.data.rfcEmisor,
      rfcReceptor:
        parsed.data.rfcReceptor,
      subtotal:
        parsed.data.subtotal,
      total:
        parsed.data.total,
      fecha:
        parsed.data.fecha,
    },
  };
}