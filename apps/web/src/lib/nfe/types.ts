export type NfeIssueStatus = "PROCESSING" | "ISSUED" | "FAILED";

export interface IssueNfeInput {
  /** Our own Invoice.id — round-tripped as the provider's idempotency/reference key. */
  reference: string;
  amount: number;
  description: string;
  customer: {
    name: string;
    document: string | null;
    email: string | null;
    address: string | null;
  };
}

export interface IssueNfeResult {
  status: NfeIssueStatus;
  /** The provider's own id for this note, used to poll/query it later. */
  providerReference: string;
  number: string | null;
  pdfUrl: string | null;
}

/**
 * PART G lists the nota fiscal provider (Focus NFe vs. NFE.io vs. eNotas)
 * as still open, and NFS-e issuance is inherently municipality-specific
 * in Brazil. This interface is the seam — swap the provider without
 * touching the /cobrancas issuance action.
 */
export interface NfeProvider {
  readonly provider: string;
  issueServiceInvoice(input: IssueNfeInput): Promise<IssueNfeResult>;
}
