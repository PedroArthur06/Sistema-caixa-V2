import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DateProvider } from 'src/shared/providers/date-provider.service';

@Injectable()
export class DailyReportsService {
  constructor(
    private prisma: PrismaService,
    private dateProvider: DateProvider,
  ) {}

  // Busca o caixa de HOJE. Se não existir, o front recebe null e mostra botão "Abrir Caixa"
  async getTodayReport() {
    const today = this.dateProvider.today();

    return this.prisma.dailyReport.findUnique({
      where: { date: today },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 5 } 
      }
    });
  }

  // Cria o caixa de hoje
  async startDay(openingBalance: number) {
    const today = this.dateProvider.today();

    const exists = await this.prisma.dailyReport.findUnique({ where: { date: today } });
    if (exists) return exists;

    return this.prisma.dailyReport.create({
      data: {
        date: today,
        openingBalance: openingBalance,
        status: 'OPEN',
      },
    });
  }
}