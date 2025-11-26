import { Controller, Get, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('global-stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get global statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Global statistics retrieved' })
  async getGlobalStats(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.analyticsService.getGlobalStats();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('station-leaderboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get station leaderboard (Admin only)' })
  @ApiResponse({ status: 200, description: 'Station leaderboard retrieved' })
  async getStationLeaderboard(@Request() req: any, @Query('limit') limit?: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.analyticsService.getStationLeaderboard(limit ? parseInt(limit) : 10);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('review-trends')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get review trends (Admin only)' })
  @ApiResponse({ status: 200, description: 'Review trends retrieved' })
  async getReviewTrends(@Request() req: any, @Query('days') days?: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.analyticsService.getReviewTrends(days ? parseInt(days) : 30);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('region-performance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get regional performance (Admin only)' })
  @ApiResponse({ status: 200, description: 'Regional performance retrieved' })
  async getRegionPerformance(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.analyticsService.getRegionPerformance();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('category-performance')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category performance (Admin only)' })
  @ApiResponse({ status: 200, description: 'Category performance retrieved' })
  async getCategoryPerformance(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.analyticsService.getCategoryPerformance();
  }
}

