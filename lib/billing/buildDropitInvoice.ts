import { CfdiIssuePayload } from "./invoice";

type BuildDropitInvoiceParams = {
  pedido: {
    folio: string;
  };

  fiscalProfile: {
    rfc: string;
    razon_social: string;
    codigo_postal: string;
    regimen_fiscal: string;
    uso_cfdi: string;
    email?: string;
  };

  settlement: {
    comision_monto: number;
    iva_monto: number;
    moneda: string;
  };
};

export function buildDropitInvoice({
  pedido,
  fiscalProfile,
  settlement,
}: BuildDropitInvoiceParams): CfdiIssuePayload {
  const subtotal = Number(
    Number(settlement.comision_monto).toFixed(2)
  );

  const iva = Number(
    Number(settlement.iva_monto).toFixed(2)
  );

  const total = Number(
    (subtotal + iva).toFixed(2)
  );

  return {
    version: "4.0",

    serie: "DROP",

    folio: pedido.folio,

    // Fecha real de expedición.
    // swMapper la convierte a hora de Ciudad de México.
    fecha: new Date().toISOString(),

    moneda: "MXN",

    tipoComprobante: "I",

    exportacion: "01",

    lugarExpedicion:
      process.env.SW_CP_EMISOR!,

    emisor: {
      rfc:
        process.env.SW_RFC_EMISOR!,

      nombre:
        process.env.SW_NOMBRE_EMISOR!,

      regimenFiscal:
        process.env.SW_REGIMEN_EMISOR!,

      codigoPostal:
        process.env.SW_CP_EMISOR!,
    },

    receptor: {
      rfc:
        fiscalProfile.rfc,

      nombre:
        fiscalProfile.razon_social,

      regimenFiscal:
        fiscalProfile.regimen_fiscal,

      codigoPostal:
        fiscalProfile.codigo_postal,

      usoCFDI:
        fiscalProfile.uso_cfdi.toUpperCase(),

      email:
        fiscalProfile.email,
    },

    conceptos: [
      {
        claveProductoServicio:
          "78102203",

        claveUnidad:
          "E48",

        unidad:
          "Servicio",

        descripcion:
          "Comisión por servicio de intermediación logística Dropit",

        cantidad: 1,

        valorUnitario:
          subtotal,

        importe:
          subtotal,

        objetoImp:
          "02",

        tasaIVA:
          0.16,
      },
    ],

    subtotal,

    impuestos: {
      totalTrasladados:
        iva,
    },

    total,
  };
}