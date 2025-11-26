import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StationsService } from './stations.service';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(private stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active stations' })
  @ApiResponse({ status: 200, description: 'List of all active stations' })
  async findAll() {
    return this.stationsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a station by ID' })
  @ApiResponse({ status: 200, description: 'Station details' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  async findOne(@Param('id') id: string) {
    return this.stationsService.findOne(id);
  }
}

