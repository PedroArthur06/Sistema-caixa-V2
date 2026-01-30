import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovementDto } from './dto/create-movement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovementType, ItemCategory, BillingType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DateProvider } from 'src/shared/providers/date-provider.service';
import { AuditService } from '../audit/audit.service';
import { GetHistoryDto } from './dto/get-history.dto';

@Injectable()
export class MovementsService {
  constructor(
    private prisma: PrismaService,
    private dateProvider: DateProvider,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateMovementDto, userId: string, ip?: string, userAgent?: string) {
    const today = this.dateProvider.today();
    
    const report = await this.prisma.dailyReport.findUnique({
      where: { date: today }
    });

    if (!report || report.status === 'CLOSED') {
      throw new BadRequestException('O caixa de hoje não está aberto!');
    }
    if (dto.type !== MovementType.INCOME_AGREEMENT && dto.amount <= 0) {
     throw new BadRequestException("O valor da movimentação deve ser maior que zero.");
  }

    let finalAmount = new Decimal(dto.amount); 
    let unitValue: Decimal | null = null;

    if (dto.type === MovementType.INCOME_AGREEMENT) {
      if (!dto.companyId) throw new BadRequestException('Convênio exige selecionar uma empresa.');

      const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
      if (!company) throw new NotFoundException('Empresa não encontrada.');
      
      // Verificar se a empresa está ativa
      if (!company.active) {
        throw new BadRequestException(`A empresa ${company.name} está inativa e não pode receber movimentações.`);
      }

      if (dto.itemCategory === ItemCategory.MEAL) {
        unitValue = company.priceUnit; 
        finalAmount = company.priceUnit.mul(dto.quantity); 
      }

      if (company.billingType === BillingType.INDIVIDUAL && !dto.consumer) {
        throw new BadRequestException(`A empresa ${company.name} exige o nome do funcionário.`);
      }
    }
    
    return this.prisma.$transaction(async (tx) => {
      // 1. Cria a movimentação usando a transação (tx)
      const movement = await tx.movement.create({
        data: {
          reportId: report.id,
          type: dto.type,
          companyId: dto.companyId,
          itemCategory: dto.itemCategory,
          consumer: dto.consumer,
          description: dto.description,
          quantity: dto.quantity,
          amount: finalAmount, 
          unitValue: unitValue,
          userId: userId,
        },
      });
    // Log de auditoria
    await tx.auditLog.create({
        data: {
            userId,
            action: 'CREATE',
            entity: 'Movement',
            entityId: movement.id,
            newValue: JSON.stringify(movement), 
            ipAddress: ip,       
            userAgent: userAgent
        }
      });

      return movement;
    });
  }

  async findAllToday() {
    const today = this.dateProvider.today();

    const report = await this.prisma.dailyReport.findUnique({ where: { date: today } });
    if (!report) return [];

    return this.prisma.movement.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    });
  }

  async delete(id: string, userId: string, ip?: string, userAgent?: string) {
    const today = this.dateProvider.today();
    const report = await this.prisma.dailyReport.findUnique({ where: { date: today } });

    if (!report || report.status === 'CLOSED') {
      throw new BadRequestException('O caixa de hoje não está aberto!');
    }

    const movement = await this.prisma.movement.findUnique({ where: { id } });
    if (!movement) throw new NotFoundException('Movimentação não encontrada.');

    if (movement.reportId !== report.id) {
       throw new BadRequestException('Não é possível excluir movimentações de dias anteriores.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.movement.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId,
          action: 'DELETE',
          entity: 'Movement',
          entityId: id,
          oldValue: JSON.stringify(movement),
          ipAddress: ip,
          userAgent: userAgent
        }
      });
    });
  }

  async findHistory(filters: GetHistoryDto) {
    const { startDate, endDate, companyId } = filters;

    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    return this.prisma.movement.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
        companyId: companyId || undefined,
      },
      include: {
        company: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClosings(filters: GetHistoryDto) {
    const { startDate, endDate, companyId } = filters;

    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    const groupByResults = await this.prisma.movement.groupBy({
      by: ['companyId'],
      where: {
        type: 'INCOME_AGREEMENT',
        companyId: companyId || undefined,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: {
        amount: true,
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    const enrichedResults = await Promise.all(
      groupByResults.map(async (item) => {
        if (!item.companyId) return null;
        
        const company = await this.prisma.company.findUnique({
          where: { id: item.companyId },
          select: { name: true },
        });

        return {
          companyId: item.companyId,
          companyName: company?.name || 'Desconhecida',
          totalAmount: item._sum.amount,
          totalQuantity: item._sum.quantity,
          totalTickets: item._count.id,
        };
      })
    );

    return enrichedResults.filter(Boolean);
  }

  async getOpenClosings(filters: GetHistoryDto) {

    let end: Date;
    if (filters.endDate) {
      const [year, month, day] = filters.endDate.split('-').map(Number);
      end = new Date(year, month - 1, day, 23, 59, 59, 999);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    const groupByResults = await this.prisma.movement.groupBy({
      by: ['companyId'],
      where: {
        type: 'INCOME_AGREEMENT',
        companyId: filters.companyId || undefined,
        closingId: null, 
        createdAt: { lte: end }
      },
      _sum: { amount: true, quantity: true },
      _count: { id: true },
      _min: { createdAt: true } 
    });

    const results = await Promise.all(groupByResults.map(async (item) => {
      if (!item.companyId) return null;

      const company = await this.prisma.company.findUnique({
        where: { id: item.companyId },
        select: { name: true, billingType: true } 
      });

      return {
        companyId: item.companyId,
        companyName: company?.name || 'Desconhecida',
        billingType: company?.billingType,
        totalAmount: item._sum.amount,
        totalQuantity: item._sum.quantity,
        totalTickets: item._count.id,
        firstOrderDate: item._min.createdAt
      };
    }));

    return results.filter(Boolean);
  }

  async getOpenMovementsByCompany(companyId: string) {
    return this.prisma.movement.findMany({
      where: {
        companyId,
        type: 'INCOME_AGREEMENT',
        closingId: null
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async performClosing(companyId: string, endDate: string) {
    return this.prisma.$transaction(async (tx) => {
      const [year, month, day] = endDate.split('-').map(Number);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      const movements = await tx.movement.findMany({
        where: {
          companyId,
          type: 'INCOME_AGREEMENT',
          closingId: null,
          createdAt: { lte: end }
        }
      });

      if (movements.length === 0) throw new BadRequestException("Nada para fechar.");

      const total = movements.reduce((acc, m) => acc.add(m.amount), new Decimal(0));
      const startDate = movements.reduce((min, m) => m.createdAt < min ? m.createdAt : min, movements[0].createdAt);

      const closing = await tx.closing.create({
        data: {
          companyId,
          totalAmount: total,
          startDate,
          endDate: end
        }
      });

      await tx.movement.updateMany({
        where: { id: { in: movements.map(m => m.id) } },
        data: { closingId: closing.id }
      });

      return closing;
    });
  }
}