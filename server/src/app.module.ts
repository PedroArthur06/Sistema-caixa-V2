import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompaniesModule } from './companies/companies.module';
import { DailyReportsModule } from './daily-reports/daily-reports.module';
import { MovementsModule } from './movements/movements.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DateProvider } from './shared/providers/date-provider.service';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [CompaniesModule, DailyReportsModule, MovementsModule, PrismaModule, AuthModule, AuditModule],
  controllers: [AppController],
  providers: [AppService, DateProvider],
  exports: [DateProvider],
})
export class AppModule {}
