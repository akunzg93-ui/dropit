export type PacCfdiValidationResult = {
  valid: boolean;
  status?: string;
  raw?: unknown;
  errors: string[];
};

export interface PacProvider {
  validateCfdi(xml: string): Promise<PacCfdiValidationResult>;

  // Los implementaremos cuando lleguemos
  // a emisión y cancelación.
  issueInvoice?(xml: string): Promise<unknown>;

  cancelInvoice?(uuid: string): Promise<unknown>;
}