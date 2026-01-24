// server/prisma/seed.ts
import { PrismaClient, BillingType, ReportStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o Seed...');

  await prisma.movement.deleteMany();
  await prisma.dailyReport.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('123456', 10);
  await prisma.user.create({
    data: {
      email: 'aline@restaurante.com',
      name: 'Aline Monteiro',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Usuário Admin criado (aline@restaurante.com / 123456)');

  const todimo = await prisma.company.create({
    data: {
      name: 'Todimo Construções',
      priceUnit: 18.00,
      billingType: 'GROUP', 
    },
  });
  
  const prime = await prisma.company.create({
    data: {
      name: 'Prime Contabilidade',
      priceUnit: 20.00,
      billingType: 'INDIVIDUAL', 
    },
  });
  console.log('Empresas Todimo e Prime criadas.');

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0); 

  await prisma.dailyReport.create({
    data: {
      date: hoje,
      openingBalance: 150.00, 
      status: 'OPEN',
    },
  });
  console.log('Caixa de hoje aberto com R$ 150,00 de troco.');

  console.log('Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });