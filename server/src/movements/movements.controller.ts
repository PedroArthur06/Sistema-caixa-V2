import { Controller, Get, Post, Body } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Controller('movements')
export class MovementsController {
  constructor(private readonly service: MovementsService) {}

  @Post()
  create(@Body() createMovementDto: CreateMovementDto) {
    return this.service.create(createMovementDto);
  }

  @Get()
  findAllToday() {
    return this.service.findAllToday();
  }
}