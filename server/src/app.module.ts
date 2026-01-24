import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompaniesModule } from './companies/companies.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { MovementsModule } from './movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [CompaniesModule, DailyReportsModule, MovementsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
