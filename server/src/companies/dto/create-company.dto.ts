import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { BillingType } from '@prisma/client';
export class CreateCompanyDto {
  @IsString()
  name: string;

  @IsNumber()
  priceUnit: number;

  @IsEnum(BillingType)
  @IsOptional()
  billingType?: BillingType;
}