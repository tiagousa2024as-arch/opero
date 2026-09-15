import type { NfeProvider } from "./types";
import { MockNfeProvider } from "./mock-provider";
import { FocusNfeProvider } from "./focusnfe-provider";

export * from "./types";

let cached: NfeProvider | null = null;

export function getNfeProvider(): NfeProvider {
  if (cached) return cached;

  const provider = process.env.NFE_PROVIDER ?? "mock";

  if (provider === "focusnfe" && process.env.NFE_API_KEY) {
    const baseUrl = process.env.NODE_ENV === "production" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
    cached = new FocusNfeProvider(process.env.NFE_API_KEY, baseUrl);
    return cached;
  }

  // provider === "nfeio" | "enotas" would go here — PART G lists these as
  // open alternatives to Focus NFe.

  cached = new MockNfeProvider();
  return cached;
}
