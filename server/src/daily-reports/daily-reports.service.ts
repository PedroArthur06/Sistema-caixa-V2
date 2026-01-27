import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DailyReportsService {
  constructor(private prisma: PrismaService) {}

  // Busca o caixa de HOJE. Se não existir, o front recebe null e mostra botão "Abrir Caixa"
  async getTodayReport() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    return this.prisma.dailyReport.findUnique({
      where: { date: today },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 5 } 
      }
    });
  }

  // Cria o caixa de hoje
  async startDay(openingBalance: number) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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