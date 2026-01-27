import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

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

  @Get()
  findAllToday() {
    return this.service.findAllToday();
  }
}