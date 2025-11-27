import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';

@ApiTags('campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new campaign (Admin only)' })
  @ApiResponse({ status: 201, description: 'Campaign created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async createCampaign(@Request() req: any, @Body() createCampaignDto: CreateCampaignDto) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.createCampaign(createCampaignDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all campaigns (Admin only)' })
  @ApiResponse({ status: 200, description: 'Campaigns retrieved successfully' })
  async getAllCampaigns(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.getAllCampaigns();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get campaign by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Campaign retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async getCampaignById(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.getCampaignById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update campaign (Admin only)' })
  @ApiResponse({ status: 200, description: 'Campaign updated successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async updateCampaign(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCampaignDto: UpdateCampaignDto
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.updateCampaign(id, updateCampaignDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete campaign (Admin only)' })
  @ApiResponse({ status: 200, description: 'Campaign deleted successfully' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  async deleteCampaign(@Request() req: any, @Param('id') id: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.deleteCampaign(id);
  }

  @Get('claims/:claimId')
  @ApiOperation({ summary: 'Get reward claim by ID' })
  @ApiResponse({ status: 200, description: 'Reward claim retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Reward claim not found' })
  async getRewardClaim(@Param('claimId') claimId: string) {
    return this.campaignsService.getRewardClaim(claimId);
  }

  @Post('claims/:claimId/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Claim a reward' })
  @ApiResponse({ status: 200, description: 'Reward claimed successfully' })
  @ApiResponse({ status: 400, description: 'Reward already claimed' })
  @ApiResponse({ status: 404, description: 'Reward claim not found' })
  async claimReward(@Param('claimId') claimId: string, @Body() body: { notes?: string }) {
    return this.campaignsService.claimReward(claimId, body.notes);
  }

  @Get('phone/:phoneNumber/claims')
  @ApiOperation({ summary: 'Get reward claims by phone number' })
  @ApiResponse({ status: 200, description: 'Reward claims retrieved successfully' })
  async getRewardClaimsByPhone(@Param('phoneNumber') phoneNumber: string) {
    return this.campaignsService.getRewardClaimsByPhone(phoneNumber);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/all-claims')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all reward claims (Admin only)' })
  @ApiResponse({ status: 200, description: 'All reward claims' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAllRewardClaims(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.getAllRewardClaims();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('station/:stationId/claims')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get reward claims for a station (Manager/Admin)' })
  @ApiResponse({ status: 200, description: 'Reward claims for station' })
  async getStationRewardClaims(@Request() req: any, @Param('stationId') stationId: string) {
    console.log('getStationRewardClaims endpoint hit');
    // Pass user info for permission check in service
    return this.campaignsService.getStationRewardClaimsWithAccess(stationId, req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/claims-summary')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon generation and claim summary (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coupon summary with generation and claim stats' })
  async getClaimsSummary(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.getClaimsSummary();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/claims-by-station')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon claims summary by station (Admin only) - shows where coupons are generated and claimed' })
  @ApiResponse({ status: 200, description: 'Coupon summary with per-station generation and claim stats' })
  async getClaimsSummaryByStation(@Request() req: any) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.getClaimsSummaryByStation();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('admin/station/:stationId/claims')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get coupon claims for a specific station (Admin only)' })
  @ApiResponse({ status: 200, description: 'Coupon claims for the station' })
  async getStationClaimsAdmin(@Request() req: any, @Param('stationId') stationId: string) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }
    return this.campaignsService.getClaimsByStation(stationId);
  }
}

