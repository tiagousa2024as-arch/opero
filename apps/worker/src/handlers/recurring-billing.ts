export type BillingMessage = { type: "recurring_billing"; [key: string]: unknown };

/**
 * Placeholder. PART F lists "recurring billing" as one of this worker's
 * jobs, but OPERO's own subscription billing (charging tenants for their
 * OPERO plan — /configuracoes/plano-e-cobranca) isn't modeled yet: there's
 * no schema for a subscription/billing-cycle entity, and the settings
 * page itself says as much ("ainda não está automatizada"). Wire this up
 * once that data model exists — for now it only logs so a message on this
 * queue doesn't wedge forever.
 */
export async function handleBillingMessage(message: BillingMessage): Promise<void> {
  console.warn("[worker] recurring billing is not implemented yet — ignoring message", message);
}
