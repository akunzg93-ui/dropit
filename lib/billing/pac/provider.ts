import type {
  CfdiIssuePayload,
  IssuedInvoice,
} from "../invoice";

export type PacCfdiValidationResult = {
  valid: boolean;
  status?: string;
  raw?: unknown;
  errors: string[];
};

export type PacPaymentData = {
  formaPago: string;
  metodoPago: "PUE";
};

export interface PacProvider {
  validateCfdi(
    xml: string
  ): Promise<PacCfdiValidationResult>;

  issueInvoice(
    payload: CfdiIssuePayload,
    payment: PacPaymentData
  ): Promise<IssuedInvoice>;

  cancelInvoice?(
    uuid: string
  ): Promise<unknown>;
}