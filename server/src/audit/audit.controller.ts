import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Query('userId') userId?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll({
      userId,
      entity,
      action,
      limit: limit ? parseInt(limit) : 100,
    });
  }

  @Get('entity')
  async getEntityLogs(
    @Query('entity') entity: string,
    @Query('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entity, entityId);
  }

  @Get('user')
  async getUserLogs(
    @Query('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findByUser(userId, limit ? parseInt(limit) : 50);
  }
}
