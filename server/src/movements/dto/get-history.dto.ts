import { IsOptional, IsString, IsDateString } from 'class-validator';

export class GetHistoryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  companyId?: string;
}