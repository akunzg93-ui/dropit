import type {
  CfdiConcept,
  CfdiIssuePayload,
} from "../invoice";

export type SwPaymentData = {
  formaPago: string;
  metodoPago: string;
};

type SwTraslado = {
  Base: string;
  Impuesto: "002";
  TipoFactor: "Tasa";
  TasaOCuota: string;
  Importe: string;
};

type SwConcepto = {
  ClaveProdServ: string;
  NoIdentificacion?: string;
  Cantidad: string;
  ClaveUnidad: string;
  Unidad: string;
  Descripcion: string;
  ValorUnitario: string;
  Importe: string;
  ObjetoImp: "02";

  Impuestos: {
    Traslados: SwTraslado[];
  };
};

export type SwCfdiJson = {
  Version: "4.0";

  Serie: string;
  Folio: string;

  Fecha: string;

  Sello: "";
  NoCertificado: "";
  Certificado: "";

  FormaPago: string;
  MetodoPago: string;

  SubTotal: string;
  Moneda: "MXN";
  Total: string;

  TipoDeComprobante: "I";
  Exportacion: "01";

  LugarExpedicion: string;

  Emisor: {
    Rfc: string;
    Nombre: string;
    RegimenFiscal: string;
  };

  Receptor: {
    Rfc: string;
    Nombre: string;
    DomicilioFiscalReceptor: string;
    RegimenFiscalReceptor: string;
    UsoCFDI: string;
  };

  Conceptos: SwConcepto[];

  Impuestos: {
    TotalImpuestosTrasladados: string;

    Traslados: SwTraslado[];
  };
};

function decimal(
  value: number,
  decimals = 2
): string {
  return Number(value).toFixed(decimals);
}

function redondear(
  value: number,
  decimals = 2
): number {
  const factor = 10 ** decimals;

  return (
    Math.round(
      (value + Number.EPSILON) * factor
    ) / factor
  );
}

function formatoTasa(
  tasa: number
): string {
  return Number(tasa).toFixed(6);
}

function normalizarTexto(
  value: string
): string {
  return String(value || "").trim();
}

function normalizarCodigo(
  value: string
): string {
  return normalizarTexto(value).toUpperCase();
}

function formatearFechaSw(
  fecha: string
): string {
  const date = new Date(fecha);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      "CFDI_INVALID_DATE"
    );
  }

  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Mexico_City",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    ).formatToParts(date);

  const get = (type: string) =>
    parts.find(
      (part) => part.type === type
    )?.value;

  return `${get("year")}-${get(
    "month"
  )}-${get("day")}T${get(
    "hour"
  )}:${get("minute")}:${get(
    "second"
  )}`;
}

function mapConcepto(
  concepto: CfdiConcept
): {
  concepto: SwConcepto;
  traslado: SwTraslado;
  iva: number;
} {
  const base = redondear(
    concepto.importe
  );

  const iva = redondear(
    base * concepto.tasaIVA
  );

  const traslado: SwTraslado = {
    Base: decimal(base),

    Impuesto: "002",

    TipoFactor: "Tasa",

    TasaOCuota:
      formatoTasa(
        concepto.tasaIVA
      ),

    Importe: decimal(iva),
  };

  const mapped: SwConcepto = {
    ClaveProdServ:
      normalizarCodigo(
        concepto.claveProductoServicio
      ),

    Cantidad: String(
      concepto.cantidad
    ),

    ClaveUnidad:
      normalizarCodigo(
        concepto.claveUnidad
      ),

    Unidad:
      normalizarTexto(
        concepto.unidad
      ),

    Descripcion:
      normalizarTexto(
        concepto.descripcion
      ),

    ValorUnitario:
      decimal(
        concepto.valorUnitario
      ),

    Importe:
      decimal(
        concepto.importe
      ),

    ObjetoImp:
      concepto.objetoImp,

    Impuestos: {
      Traslados: [
        traslado,
      ],
    },
  };

  if (
    concepto.noIdentificacion
  ) {
    mapped.NoIdentificacion =
      concepto.noIdentificacion;
  }

  return {
    concepto: mapped,
    traslado,
    iva,
  };
}

export function mapCfdiToSwJson(
  payload: CfdiIssuePayload,
  payment: SwPaymentData
): SwCfdiJson {
  if (
    !payment.formaPago ||
    !payment.metodoPago
  ) {
    throw new Error(
      "CFDI_PAYMENT_DATA_MISSING"
    );
  }

  if (
    !payload.emisor.rfc ||
    !payload.emisor.nombre ||
    !payload.emisor
      .regimenFiscal ||
    !payload.lugarExpedicion
  ) {
    throw new Error(
      "CFDI_ISSUER_DATA_MISSING"
    );
  }

  if (
    !payload.receptor.rfc ||
    !payload.receptor.nombre ||
    !payload.receptor
      .codigoPostal ||
    !payload.receptor
      .regimenFiscal ||
    !payload.receptor.usoCFDI
  ) {
    throw new Error(
      "CFDI_RECEIVER_DATA_MISSING"
    );
  }

  if (
    payload.conceptos.length ===
    0
  ) {
    throw new Error(
      "CFDI_CONCEPTS_MISSING"
    );
  }

  const conceptosMapeados =
    payload.conceptos.map(
      mapConcepto
    );

  const ivaConceptos =
    redondear(
      conceptosMapeados.reduce(
        (total, item) =>
          total + item.iva,
        0
      )
    );

  const ivaEsperado =
    redondear(
      payload.impuestos
        .totalTrasladados
    );

  if (
    Math.abs(
      ivaConceptos -
        ivaEsperado
    ) > 0.01
  ) {
    throw new Error(
      "CFDI_TAX_TOTAL_MISMATCH"
    );
  }

  return {
    Version:
      payload.version,

    Serie:
      payload.serie,

    Folio:
      payload.folio,

    Fecha:
      formatearFechaSw(
        payload.fecha
      ),

    /*
      SW completa estos datos
      utilizando el CSD cargado
      previamente en la cuenta.
    */
    Sello: "",
    NoCertificado: "",
    Certificado: "",

    FormaPago:
      payment.formaPago,

    MetodoPago:
      payment.metodoPago,

    SubTotal:
      decimal(
        payload.subtotal
      ),

    Moneda:
      payload.moneda,

    Total:
      decimal(
        payload.total
      ),

    TipoDeComprobante:
      payload.tipoComprobante,

    Exportacion:
      payload.exportacion,

    LugarExpedicion:
      payload.lugarExpedicion,

    Emisor: {
      Rfc:
        normalizarCodigo(
          payload.emisor.rfc
        ),

      Nombre:
        normalizarTexto(
          payload.emisor.nombre
        ),

      RegimenFiscal:
        normalizarCodigo(
          payload.emisor
            .regimenFiscal
        ),
    },

    Receptor: {
      Rfc:
        normalizarCodigo(
          payload.receptor.rfc
        ),

      Nombre:
        normalizarTexto(
          payload.receptor.nombre
        ),

      DomicilioFiscalReceptor:
        normalizarCodigo(
          payload.receptor
            .codigoPostal
        ),

      RegimenFiscalReceptor:
        normalizarCodigo(
          payload.receptor
            .regimenFiscal
        ),

      UsoCFDI:
        normalizarCodigo(
          payload.receptor
            .usoCFDI
        ),
    },

    Conceptos:
      conceptosMapeados.map(
        (item) =>
          item.concepto
      ),

    Impuestos: {
      TotalImpuestosTrasladados:
        decimal(
          ivaEsperado
        ),

      Traslados:
        conceptosMapeados.map(
          (item) =>
            item.traslado
        ),
    },
  };
}