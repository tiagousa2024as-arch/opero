import type { NfeProvider, IssueNfeInput, IssueNfeResult, NfeIssueStatus } from "./types";

// https://focusnfe.com.br/doc/#nfse-emitir-nfse — statuses returned by Focus NFe.
const FOCUS_STATUS_MAP: Record<string, NfeIssueStatus> = {
  processando_autorizacao: "PROCESSING",
  autorizado: "ISSUED",
  erro_autorizacao: "FAILED",
  cancelado: "FAILED",
};

/**
 * Requires a real Focus NFe account (NFE_API_KEY) plus the tenant's
 * municipal service registration on file with Focus NFe — see PART G.
 * Until both exist, NFE_PROVIDER should stay unset so /cobrancas falls
 * back to the mock provider.
 */
export class FocusNfeProvider implements NfeProvider {
  readonly provider = "focusnfe";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  private authHeader(): string {
    // Focus NFe uses HTTP Basic auth with the API token as the username.
    return `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`;
  }

  async issueServiceInvoice(input: IssueNfeInput): Promise<IssueNfeResult> {
    const res = await fetch(`${this.baseUrl}/v2/nfse?ref=${encodeURIComponent(input.reference)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: this.authHeader(),
      },
      body: JSON.stringify({
        data_emissao: new Date().toISOString(),
        prestador: {}, // filled in from tenant municipal registration once that data model exists
        tomador: {
          razao_social: input.customer.name,
          cpf: input.customer.document,
          email: input.customer.email,
          endereco: input.customer.address,
        },
        servico: {
          discriminacao: input.description,
          valor_servicos: input.amount,
        },
      }),
    });

    if (!res.ok && res.status !== 422) {
      // 422 from Focus NFe usually still carries a usable body (validation
      // detail) rather than being a transport failure — let the JSON parse
      // below surface it instead of throwing blind here.
      throw new Error(`Focus NFe API error (${res.status}): ${await res.text()}`);
    }

    const data = (await res.json()) as { status: string; ref: string; numero?: string; caminho_xml_nota_fiscal?: string };
    const status = FOCUS_STATUS_MAP[data.status] ?? "PROCESSING";

    return {
      status,
      providerReference: data.ref,
      number: data.numero ?? null,
      pdfUrl: data.caminho_xml_nota_fiscal ?? null,
    };
  }
}
