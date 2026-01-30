import { Controller, Get, Post, Body, UseGuards, Req, Delete, Param, Query } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { GetHistoryDto } from './dto/get-history.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Controller('movements')
@UseGuards(JwtAuthGuard) 
export class MovementsController {
  constructor(private readonly service: MovementsService) {}

  @Post()
  create(@Body() createMovementDto: CreateMovementDto, @Req() req: RequestWithUser) {
    const userId = req.user.id; 
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent']; 
    return this.service.create(createMovementDto, userId, ip, userAgent);
  }

  @Get('history')
  getHistory(@Query() query: GetHistoryDto) {
    return this.service.findHistory(query);
  }

  @Get('closings')
  getClosings(@Query() query: GetHistoryDto) {
    return this.service.getClosings(query);
  }

  @Get()
  findAllToday() {
    return this.service.findAllToday();
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.id;
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const userAgent = req.headers['user-agent'];
    return this.service.delete(id, userId, ip, userAgent);
  }

  @Get('closings/open')
  getOpenClosings(@Query() query: GetHistoryDto) {
    return this.service.getOpenClosings(query);
  }

  @Get('closings/details/:companyId')
  getClosingDetails(@Param('companyId') companyId: string) {
    return this.service.getOpenMovementsByCompany(companyId);
  }

  @Post('closings/finish')
  finishClosing(@Body() body: { companyId: string, endDate: string }) {
    return this.service.performClosing(body.companyId, body.endDate);
  }
}