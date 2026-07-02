import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { ContractStatus, HistoryAction } from '../generated/prisma/enums';
import { PrismaService } from '../src/shared/prisma/prisma.service';

const prisma = new PrismaService();

async function main() {
  console.log('🌱 Iniciando o Seed...');

  const existingTenant = await prisma.tenant.findFirst();
  if (existingTenant) {
    console.log('⏭️  Banco já populado, pulando seed.');
    return;
  }
  // 1. Limpa o banco na ordem correta para evitar erro de Foreign Key
  await prisma.history.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Cria os Tenants
  const tenantAlpha = await prisma.tenant.create({
    data: { id: randomUUID(), name: 'Empresa Alpha' },
  });
  const tenantBeta = await prisma.tenant.create({
    data: { id: randomUUID(), name: 'Empresa Beta' },
  });

  // 3. Hash da senha padrão
  const passwordHash = await bcrypt.hash('password123', 10);

  // 4. Cria os Usuários
  const adminAlpha = await prisma.user.create({
    data: {
      email: 'admin@alpha.com',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: tenantAlpha.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'viewer@alpha.com',
      password: passwordHash,
      role: 'VIEWER',
      tenantId: tenantAlpha.id,
    },
  });

  const adminBeta = await prisma.user.create({
    data: {
      email: 'admin@beta.com',
      password: passwordHash,
      role: 'ADMIN',
      tenantId: tenantBeta.id,
    },
  });

  // 5. Cria o Template Ativo (Apenas no Tenant Alpha para exemplo)
  const fieldNameKey = randomUUID();
  const fieldValueKey = randomUUID();
  const fieldDateKey = randomUUID();

  const templateAlpha = await prisma.template.create({
    data: {
      name: 'Contrato Padrão de Prestação de Serviços',
      isActive: true,
      tenantId: tenantAlpha.id,
      fieldsConfig: {
        fields: [
          {
            key: fieldNameKey,
            label: 'Nome do Cliente',
            type: 'text',
            required: true,
          },
          {
            key: fieldValueKey,
            label: 'Valor Mensal (R$)',
            type: 'number',
            required: true,
          },
          {
            key: fieldDateKey,
            label: 'Data de Início',
            type: 'date',
            required: false,
          },
        ],
      },
    },
  });

  const fieldNomeBetaKey = randomUUID();
  const fieldProjetoKey = randomUUID();

  const templateBeta = await prisma.template.create({
    data: {
      name: 'Contrato de Desenvolvimento de Software',
      isActive: true,
      tenantId: tenantBeta.id,
      fieldsConfig: {
        fields: [
          {
            key: fieldNomeBetaKey,
            label: 'Nome do Contratante',
            type: 'text',
            required: true,
          },
          {
            key: fieldProjetoKey,
            label: 'Nome do Projeto',
            type: 'text',
            required: true,
          },
        ],
      },
    },
  });

  // 6. Cria 5 Contratos para o Tenant Alpha
  const contratosSeedAlpha = [
    {
      name: 'Contrato Social Media - Hamburgueria X',
      client: 'João Silva',
      value: 1500,
      date: '2026-10-01',
      status: ContractStatus.ACTIVE,
    },
    {
      name: 'Setup de Tráfego - Academia Y',
      client: 'Maria Souza',
      value: 2300,
      date: '2026-11-15',
      status: ContractStatus.CLOSED,
    },
    {
      name: 'Acessoria de Conteúdo - Padaria Central',
      client: 'Padaria Central',
      value: 800,
      date: '2026-01-10',
      status: ContractStatus.DRAFT,
    },
    {
      name: 'Desenvolvimento Web - Tech Solutions',
      client: 'Tech Solutions',
      value: 5000,
      date: '2026-02-01',
      status: ContractStatus.DRAFT,
    },
    {
      name: 'Identidade Visual - Clínica Vida',
      client: 'Clínica Vida',
      value: 3200,
      date: '2026-03-20',
      status: ContractStatus.DRAFT,
    },
  ];

  for (const c of contratosSeedAlpha) {
    const contract = await prisma.contract.create({
      data: {
        name: c.name,
        tenantId: tenantAlpha.id,
        templateId: templateAlpha.id,
        status: c.status as any,
        content: {
          templateSnapshot: (templateAlpha.fieldsConfig as any).fields,
          answers: {
            [fieldNameKey]: c.client,
            [fieldValueKey]: c.value,
            [fieldDateKey]: c.date,
          },
        },
      },
    });

    // Cria o histórico de geração inicial do contrato
    await prisma.history.create({
      data: {
        action: HistoryAction.CREATE,
        contractId: contract.id,
        changedById: adminAlpha.id,
      },
    });
  }

  const contractBeta = await prisma.contract.create({
    data: {
      name: `Website Institucional - Barbearia`,
      tenantId: tenantBeta.id,
      templateId: templateBeta.id,
      status: ContractStatus.ACTIVE,
      content: {
        // aqui
        templateSnapshot: (templateBeta.fieldsConfig as { fields: unknown[] })
          .fields,
        answers: {
          [fieldNomeBetaKey]: 'Barbearia Z Headquarter',
          [fieldProjetoKey]: 'Website Institucional com Agendamento',
        },
      } as any,
    },
  });

  await prisma.history.create({
    data: {
      action: HistoryAction.CREATE,
      contractId: contractBeta.id,
      changedById: adminBeta.id,
    },
  });

  console.log('✅ Seed finalizado com sucesso!');
  console.log('');
  console.log('📋 Credenciais de acesso:');
  console.log('  Tenant Alpha — Admin:  admin@alpha.com  / password123');
  console.log('  Tenant Alpha — Viewer: viewer@alpha.com / password123');
  console.log('  Tenant Beta  — Admin:  admin@beta.com   / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
