import { randomUUID } from "crypto";
import type { NfeProvider, IssueNfeInput, IssueNfeResult } from "./types";

/**
 * Default when no NFE_API_KEY is configured. NFS-e issuance also needs
 * the tenant's municipal tax registration (Inscrição Municipal, tax
 * regime, service code) — none of which exists in the schema yet — so
 * this stands in until both a provider account and that registration
 * data exist.
 */
export class MockNfeProvider implements NfeProvider {
  readonly provider = "mock";

  async issueServiceInvoice(_input: IssueNfeInput): Promise<IssueNfeResult> {
    return {
      status: "ISSUED",
      providerReference: `mock_${randomUUID()}`,
      number: `MOCK-${Math.floor(Math.random() * 100000)}`,
      pdfUrl: null,
    };
  }
}
