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
}

