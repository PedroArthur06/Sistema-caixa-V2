import { Controller, Get, Post, Body } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';

@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly service: DailyReportsService) {}

  @Get('today')
  getToday() {
    return this.service.getTodayReport();
  }

  @Post('start')
  startDay(@Body() body: { openingBalance: number }) {
    return this.service.startDay(body.openingBalance);
  }
}