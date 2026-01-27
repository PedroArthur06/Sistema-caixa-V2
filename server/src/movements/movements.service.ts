import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovementDto } from './dto/create-movement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovementType, ItemCategory, BillingType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMovementDto) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const report = await this.prisma.dailyReport.findUnique({
      where: { date: today }
    });

    if (!report || report.status === 'CLOSED') {
      throw new BadRequestException('O caixa de hoje não está aberto!');
    }

    let finalAmount = dto.amount;
    let unitValue: Decimal | null = null;

    if (dto.type === MovementType.INCOME_AGREEMENT) {
      if (!dto.companyId) throw new BadRequestException('Convênio exige selecionar uma empresa.');

      const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
      if (!company) throw new NotFoundException('Empresa não encontrada.');

      if (dto.itemCategory === ItemCategory.MEAL) {
        unitValue = company.priceUnit; 
        finalAmount = Number(company.priceUnit) * dto.quantity; 
      }

      if (company.billingType === BillingType.INDIVIDUAL && !dto.consumer) {
        throw new BadRequestException(`A empresa ${company.name} exige o nome do funcionário.`);
      }
    }
    return this.prisma.movement.create({
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
      },
    });
  }

  async findAllToday() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const report = await this.prisma.dailyReport.findUnique({ where: { date: today } });
    if (!report) return [];

    return this.prisma.movement.findMany({
      where: { reportId: report.id },
      orderBy: { createdAt: 'desc' },
      include: { company: true }
    });
  }
}