import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  create(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        name: createCompanyDto.name,
        priceUnit: createCompanyDto.priceUnit,
        billingType: createCompanyDto.billingType || 'GROUP', 
      },
    });
  }

  findAll() {
    return this.prisma.company.findMany({
      where: { active: true }
    });
  }
}