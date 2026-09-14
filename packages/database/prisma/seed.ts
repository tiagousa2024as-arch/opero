import { prisma } from "../src/index";

async function main() {
  const existing = await prisma.tenant.findFirst({ where: { name: "Oficina Demo" } });
  if (existing) {
    console.log("Seed data already present, skipping.");
    return;
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: "Oficina Demo",
      plan: "trial",
      serviceCategories: {
        create: [
          { name: "Troca de óleo", defaultPrice: 120 },
          { name: "Revisão geral", defaultPrice: 350 },
          { name: "Alinhamento e balanceamento", defaultPrice: 150 },
        ],
      },
    },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: "Owner Demo",
      email: "owner@demo.opero.com.br",
      // bcrypt hash of "senha123" — dev/seed only, never used in production.
      passwordHash: "$2a$10$J8LWk.qPU1o8A2BcvfyvV.oPDT5W0LRviYyw7GhX64LGFzqbX7BUG",
      role: "OWNER",
    },
  });

  console.log(`Seeded tenant ${tenant.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
