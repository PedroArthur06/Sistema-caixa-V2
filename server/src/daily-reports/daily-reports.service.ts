import { Injectable } from '@nestjs/common';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Injectable()
export class DailyReportsService {
  create(createDailyReportDto: CreateDailyReportDto) {
    return 'This action adds a new dailyReport';
  }

  findAll() {
    return `This action returns all dailyReports`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dailyReport`;
  }

  update(id: number, updateDailyReportDto: UpdateDailyReportDto) {
    return `This action updates a #${id} dailyReport`;
  }

  remove(id: number) {
    return `This action removes a #${id} dailyReport`;
  }
}
