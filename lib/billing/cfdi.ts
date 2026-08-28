import { XMLParser } from "fast-xml-parser";

export type CfdiData = {
  uuid: string;

  rfcEmisor: string;
  nombreEmisor?: string;

  rfcReceptor: string;
  nombreReceptor?: string;

  subtotal: number;
  total: number;

  fecha: string;

  // Datos del comprobante
  noCertificadoCfdi?: string;
  selloCfdi?: string;

  // Timbre Fiscal Digital
  fechaTimbrado?: string;
  noCertificadoSat?: string;
  selloSat?: string;
  rfcProvCertif?: string;
};

export type CfdiValidationResult = {
  valid: boolean;
  data?: CfdiData;
  errors: string[];
};

function normalizarRFC(value?: string) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function textoOpcional(
  value: unknown
): string | undefined {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  const result =
    String(value).trim();

  return result || undefined;
}

function numero(value: unknown) {
  const result = Number(value);

  if (!Number.isFinite(result)) {
    return 0;
  }

  return result;
}

export function parseCfdiXml(
  xml: string
): CfdiValidationResult {
  const errors: string[] = [];

  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      removeNSPrefix: true,
    });

    const parsed =
      parser.parse(xml);

    const comprobante =
      parsed?.Comprobante;

    if (!comprobante) {
      return {
        valid: false,
        errors: [
          "El XML no contiene un CFDI válido",
        ],
      };
    }

    const emisor =
      comprobante.Emisor;

    const receptor =
      comprobante.Receptor;

    const complemento =
      comprobante.Complemento;

    const timbre =
      complemento?.TimbreFiscalDigital ||
      (Array.isArray(complemento)
        ? complemento.find(
            (item) =>
              item
                ?.TimbreFiscalDigital
          )
            ?.TimbreFiscalDigital
        : null);

    if (!emisor?.Rfc) {
      errors.push(
        "El CFDI no contiene RFC del emisor"
      );
    }

    if (!receptor?.Rfc) {
      errors.push(
        "El CFDI no contiene RFC del receptor"
      );
    }

    if (!timbre?.UUID) {
      errors.push(
        "El CFDI no contiene Timbre Fiscal Digital"
      );
    }

    if (!comprobante.Fecha) {
      errors.push(
        "El CFDI no contiene fecha de emisión"
      );
    }

    const total =
      numero(
        comprobante.Total
      );

    const subtotal =
      numero(
        comprobante.SubTotal
      );

    if (total <= 0) {
      errors.push(
        "El total del CFDI no es válido"
      );
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: true,
      errors: [],

      data: {
        uuid:
          String(
            timbre.UUID
          ).toUpperCase(),

        rfcEmisor:
          normalizarRFC(
            emisor.Rfc
          ),

        nombreEmisor:
          textoOpcional(
            emisor.Nombre
          ),

        rfcReceptor:
          normalizarRFC(
            receptor.Rfc
          ),

        nombreReceptor:
          textoOpcional(
            receptor.Nombre
          ),

        subtotal,
        total,

        fecha:
          String(
            comprobante.Fecha
          ),

        // ==========================================
        // Certificado / sello CFDI
        // ==========================================

        noCertificadoCfdi:
          textoOpcional(
            comprobante.NoCertificado
          ),

        // ==========================================
        // Timbre Fiscal Digital
        // ==========================================

        fechaTimbrado:
          textoOpcional(
            timbre.FechaTimbrado
          ),

        noCertificadoSat:
          textoOpcional(
            timbre.NoCertificadoSAT
          ),

        selloSat:
          textoOpcional(
            timbre.SelloSAT
          ),

        /*
          SW/SAT usan SelloCFD dentro del
          Timbre Fiscal Digital.

          Preferimos este valor sobre el
          Sello del comprobante cuando
          exista.
        */
        selloCfdi:
          textoOpcional(
            timbre.SelloCFD
          ) ||
          textoOpcional(
            comprobante.Sello
          ),

        rfcProvCertif:
          textoOpcional(
            timbre.RfcProvCertif
          ),
      },
    };
  } catch (error) {
    console.error(
      "Error leyendo CFDI:",
      error
    );

    return {
      valid: false,
      errors: [
        "No fue posible interpretar el XML",
      ],
    };
  }
}

export function validarCfdiContraOperacion(
  params: {
    cfdi: CfdiData;
    rfcEstablecimiento: string;
    rfcVendedor: string;
    totalEsperado?: number;
  }
): CfdiValidationResult {
  const {
    cfdi,
    rfcEstablecimiento,
    rfcVendedor,
    totalEsperado,
  } = params;

  const errors: string[] = [];

  if (
    normalizarRFC(
      cfdi.rfcEmisor
    ) !==
    normalizarRFC(
      rfcEstablecimiento
    )
  ) {
    errors.push(
      "El RFC emisor no corresponde al establecimiento"
    );
  }

  if (
    normalizarRFC(
      cfdi.rfcReceptor
    ) !==
    normalizarRFC(
      rfcVendedor
    )
  ) {
    errors.push(
      "El RFC receptor no corresponde al vendedor"
    );
  }

  if (
    totalEsperado !==
      undefined &&
    Math.abs(
      cfdi.total -
        totalEsperado
    ) > 0.01
  ) {
    errors.push(
      "El importe del CFDI no corresponde al servicio"
    );
  }

  return {
    valid:
      errors.length === 0,

    data:
      cfdi,

    errors,
  };
}