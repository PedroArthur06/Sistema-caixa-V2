import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DailyReportsService } from './daily-reports.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Controller('daily-reports')
export class DailyReportsController {
  constructor(private readonly dailyReportsService: DailyReportsService) {}

  @Post()
  create(@Body() createDailyReportDto: CreateDailyReportDto) {
    return this.dailyReportsService.create(createDailyReportDto);
  }

  @Get()
  findAll() {
    return this.dailyReportsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dailyReportsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDailyReportDto: UpdateDailyReportDto) {
    return this.dailyReportsService.update(+id, updateDailyReportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dailyReportsService.remove(+id);
  }
}
