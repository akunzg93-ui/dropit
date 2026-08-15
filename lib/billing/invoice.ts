export type CfdiParty = {
  rfc: string;
  nombre: string;
  regimenFiscal: string;
  codigoPostal: string;
  email?: string;
};

export type CfdiConcept = {
  claveProductoServicio: string;
  claveUnidad: string;

  unidad: string;

  descripcion: string;

  cantidad: number;

  valorUnitario: number;

  importe: number;

  objetoImp: "02";

  tasaIVA: number;

  noIdentificacion?: string;
};

export type CfdiIssuePayload = {
  version: "4.0";

  serie: string;
  folio: string;

  fecha: string;

  moneda: "MXN";

  tipoComprobante: "I";

  exportacion: "01";

  lugarExpedicion: string;

  emisor: CfdiParty;

  receptor: CfdiParty & {
    usoCFDI: string;
  };

  conceptos: CfdiConcept[];

  subtotal: number;

  impuestos: {
    totalTrasladados: number;
  };

  total: number;
};

export type IssuedInvoice = {
  uuid: string;

  xml: string;

  pdf?: string;

  pacReference?: string;

  raw?: unknown;
};