import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MovementType, ItemCategory } from '@prisma/client';

export class CreateMovementDto {
  @IsEnum(MovementType)
  type: MovementType;

  @IsUUID()
  @IsOptional()
  companyId?: string;

  @IsEnum(ItemCategory)
  @IsOptional()
  itemCategory?: ItemCategory; 

  @IsString()
  @IsOptional()
  consumer?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}