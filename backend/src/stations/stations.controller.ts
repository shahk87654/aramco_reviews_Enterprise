import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new station (Admin only)' })
  @ApiResponse({ status: 201, description: 'Station created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createStation(@Request() req: any, @Body() createStationDto: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.stationsService.createStation(createStationDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a station (Admin only)' })
  @ApiResponse({ status: 200, description: 'Station updated successfully' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async updateStation(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateStationDto: any
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.stationsService.updateStation(id, updateStationDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a station (Admin only)' })
  @ApiResponse({ status: 200, description: 'Station deleted successfully' })
  @ApiResponse({ status: 404, description: 'Station not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async deleteStation(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.stationsService.deleteStation(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stations including inactive (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all stations' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllStations(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.stationsService.getAllStationsIncludingInactive();
  }
}

