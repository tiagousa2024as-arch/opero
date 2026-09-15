import { test, expect } from "@playwright/test";

/**
 * Covers the full Phase 1 golden path required by the blueprint:
 * sign up -> create customer -> create OS -> generate charge -> mark paid.
 * Each run uses a fresh email so it can run repeatedly against the same
 * database without colliding with a previous run's tenant.
 */
test("sign up, create customer, open an OS, charge it and mark it paid", async ({ page }) => {
  const unique = Date.now();
  const email = `e2e-${unique}@opero.test`;
  const password = "senha12345";
  const companyName = `Oficina E2E ${unique}`;
  const customerName = `Cliente E2E ${unique}`;

  await page.goto("/cadastro");
  await page.getByLabel("Nome da empresa").fill(companyName);
  await page.getByLabel("Seu nome").fill("Dono Teste");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/onboarding\/empresa/);
  await page.getByLabel("Nome da empresa").fill(companyName);
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/equipe/);
  await page.getByRole("link", { name: "Continuar" }).click();

  await expect(page).toHaveURL(/\/onboarding\/plano/);
  await page.getByRole("button", { name: /teste grátis/i }).click();

  await expect(page).toHaveURL(/\/onboarding\/concluido/);
  await page.getByRole("link", { name: "Ir para o painel" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  // Create customer
  await page.goto("/clientes/novo");
  await page.getByLabel("Nome").fill(customerName);
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page).toHaveURL(/\/clientes\/[a-z0-9]+$/);
  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  // Create a service order for that customer
  const customerUrl = page.url();
  const customerId = customerUrl.split("/").pop()!;
  await page.goto(`/ordens-de-servico/nova?customerId=${customerId}`);
  await page.getByLabel("Descrição").fill("Troca de óleo");
  await page.getByLabel("Qtd").fill("1");
  await page.getByLabel("Valor unit.").fill("150");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByText("Total: R$ 150,00")).toBeVisible();
  await page.getByRole("button", { name: "Salvar ordem de serviço" }).click();
  await expect(page).toHaveURL(/\/ordens-de-servico\/[a-z0-9]+$/);

  // Generate a charge from the OS
  await page.getByRole("link", { name: "Gerar cobrança" }).click();
  await expect(page).toHaveURL(/\/cobrancas\/novo/);
  await page.getByLabel("Vencimento").fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Gerar cobrança" }).click();
  await expect(page).toHaveURL(/\/cobrancas\/[a-z0-9]+$/);
  await expect(page.getByText("Pendente")).toBeVisible();

  // Mark it paid (mock gateway dev action) and confirm it cascades.
  await page.getByRole("button", { name: "Marcar como paga (teste)" }).click();
  await expect(page.getByText("Paga", { exact: true })).toBeVisible();

  await page.goto("/financeiro/fluxo-de-caixa");
  await expect(page.getByText("R$ 150,00").first()).toBeVisible();
});
