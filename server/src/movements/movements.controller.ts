import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('movements')
@UseGuards(JwtAuthGuard)
export class MovementsController {
  constructor(private readonly service: MovementsService) {}

  @Post()
  create(@Body() createMovementDto: CreateMovementDto, @Request() req) {
    return this.service.create(createMovementDto, req.user.userId);
  }

  @Get()
  findAllToday() {
    return this.service.findAllToday();
  }
}