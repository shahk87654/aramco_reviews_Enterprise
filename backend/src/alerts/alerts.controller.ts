import { Controller, Get, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { AlertPriority, AlertStatus } from '../database/entities/alert.entity';

@ApiTags('alerts')
@Controller('stations/:stationId/alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get alerts for a station' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  async getAlerts(
    @Param('stationId') stationId: string,
    @Query('status') status?: AlertStatus,
    @Query('priority') priority?: AlertPriority
  ) {
    return this.alertsService.getAlerts(stationId, status, priority);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':alertId/acknowledge')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Acknowledge an alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('stationId') stationId: string,
    @Param('alertId') alertId: string,
    @Request() req: any
  ) {
    const userId = req.user.sub || req.user.userId || req.user.id;
    await this.alertsService.acknowledgeAlert(alertId, userId);
    return { message: 'Alert acknowledged' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':alertId/resolve')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resolve an alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved' })
  async resolveAlert(
    @Param('stationId') stationId: string,
    @Param('alertId') alertId: string,
    @Body() body: { resolutionNote: string },
    @Request() req: any
  ) {
    const userId = req.user.sub || req.user.userId || req.user.id;
    await this.alertsService.resolveAlert(alertId, userId, body.resolutionNote);
    return { message: 'Alert resolved' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getStats(@Param('stationId') stationId: string) {
    return this.alertsService.getAlertStats(stationId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('config')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update alert configuration for a station' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateConfig(@Param('stationId') stationId: string, @Body() config: any) {
    return this.alertsService.updateAlertConfig(stationId, config);
  }
}
