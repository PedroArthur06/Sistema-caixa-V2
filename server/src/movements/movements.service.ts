import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovementDto } from './dto/create-movement.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { MovementType, ItemCategory, BillingType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { DateProvider } from 'src/shared/providers/date-provider.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MovementsService {
  constructor(
    private prisma: PrismaService,
    private dateProvider: DateProvider,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateMovementDto, userId: string) {
    const today = this.dateProvider.today();
    
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
      
      // Verificar se a empresa está ativa
      if (!company.active) {
        throw new BadRequestException(`A empresa ${company.name} está inativa e não pode receber movimentações.`);
      }

      if (dto.itemCategory === ItemCategory.MEAL) {
        unitValue = company.priceUnit; 
        finalAmount = Number(company.priceUnit) * dto.quantity; 
      }

      if (company.billingType === BillingType.INDIVIDUAL && !dto.consumer) {
        throw new BadRequestException(`A empresa ${company.name} exige o nome do funcionário.`);
      }
    }
    
    const movement = await this.prisma.movement.create({
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
    await this.auditService.log({
      userId,
      action: 'CREATE',
      entity: 'Movement',
      entityId: movement.id,
      newValue: movement,
    });

    return movement;
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
}