import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign, CampaignStatus, RewardType } from '../database/entities/campaign.entity';
import { RewardClaim } from '../database/entities/reward-claim.entity';
import { Visit } from '../database/entities/visit.entity';
import { Review } from '../database/entities/review.entity';
import { Station } from '../database/entities/station.entity';
import { CreateCampaignDto, UpdateCampaignDto } from './dto/campaign.dto';
import * as QRCode from 'qrcode';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private campaignsRepository: Repository<Campaign>,
    @InjectRepository(RewardClaim)
    private rewardClaimsRepository: Repository<RewardClaim>,
    @InjectRepository(Visit)
    private visitsRepository: Repository<Visit>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Station)
    private stationsRepository: Repository<Station>,
  ) {}

  async createCampaign(createCampaignDto: CreateCampaignDto) {
    const campaign = this.campaignsRepository.create({
      name: createCampaignDto.name,
      description: createCampaignDto.description,
      reviewThreshold: createCampaignDto.reviewThreshold,
      rewardType: createCampaignDto.rewardType,
      status: createCampaignDto.status || CampaignStatus.ACTIVE,
      startDate: createCampaignDto.startDate ? new Date(createCampaignDto.startDate) : null,
      endDate: createCampaignDto.endDate ? new Date(createCampaignDto.endDate) : null,
    });

    return await this.campaignsRepository.save(campaign);
  }

  async getAllCampaigns() {
    return await this.campaignsRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['claims'],
    });
  }

  async getCampaignById(id: string) {
    const campaign = await this.campaignsRepository.findOne({
      where: { id },
      relations: ['claims'],
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return campaign;
  }

  async updateCampaign(id: string, updateCampaignDto: UpdateCampaignDto) {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    Object.assign(campaign, {
      ...updateCampaignDto,
      startDate: updateCampaignDto.startDate ? new Date(updateCampaignDto.startDate) : campaign.startDate,
      endDate: updateCampaignDto.endDate ? new Date(updateCampaignDto.endDate) : campaign.endDate,
    });

    return await this.campaignsRepository.save(campaign);
  }

  async deleteCampaign(id: string) {
    const campaign = await this.campaignsRepository.findOne({ where: { id } });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    await this.campaignsRepository.remove(campaign);
    return { message: 'Campaign deleted successfully' };
  }

  async trackVisit(phoneNumber: string, stationId: string, reviewId?: string) {
    const visit = this.visitsRepository.create({
      phoneNumber,
      stationId,
      reviewId,
      visitDate: new Date(),
    });

    return await this.visitsRepository.save(visit);
  }

  async getReviewCountByPhone(phoneNumber: string): Promise<number> {
    return await this.reviewsRepository.count({
      where: { phoneNumber },
    });
  }

  async checkAndGenerateReward(phoneNumber: string, reviewId: string, stationId: string) {
    // Get active campaigns
    const activeCampaigns = await this.campaignsRepository.find({
      where: { status: CampaignStatus.ACTIVE },
    });

    if (activeCampaigns.length === 0) {
      return null;
    }

    // Get review count for this phone number
    const reviewCount = await this.getReviewCountByPhone(phoneNumber);

    // Check each campaign
    for (const campaign of activeCampaigns) {
      // Check if campaign is within date range
      const now = new Date();
      if (campaign.startDate && campaign.startDate > now) continue;
      if (campaign.endDate && campaign.endDate < now) continue;

      // Check if review count matches threshold
      if (reviewCount === campaign.reviewThreshold) {
        // Check if reward already claimed for this campaign and phone
        const existingClaim = await this.rewardClaimsRepository.findOne({
          where: {
            phoneNumber,
            campaignId: campaign.id,
          },
        });

        if (existingClaim) {
          continue; // Already has a claim for this campaign
        }

        // Generate QR code
        const qrData = JSON.stringify({
          claimId: '',
          phoneNumber,
          campaignId: campaign.id,
          rewardType: campaign.rewardType,
          reviewId,
          stationId,
        });

        let qrCodeDataUrl: string;
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qrData);
        } catch (error) {
          console.error('Error generating QR code:', error);
          qrCodeDataUrl = '';
        }

        // Create reward claim
        const claim = this.rewardClaimsRepository.create({
          phoneNumber,
          campaignId: campaign.id,
          reviewId,
          stationId,
          qrCode: qrCodeDataUrl,
          isClaimed: false,
        });

        const savedClaim = await this.rewardClaimsRepository.save(claim);

        // Update QR code with claim ID
        const updatedQrData = JSON.stringify({
          claimId: savedClaim.id,
          phoneNumber,
          campaignId: campaign.id,
          rewardType: campaign.rewardType,
          reviewId,
          stationId,
        });

        try {
          const updatedQrCode = await QRCode.toDataURL(updatedQrData);
          await this.rewardClaimsRepository.update(savedClaim.id, {
            qrCode: updatedQrCode,
          });
          savedClaim.qrCode = updatedQrCode;
        } catch (error) {
          console.error('Error updating QR code:', error);
        }

        return {
          claim: savedClaim,
          campaign,
        };
      }
    }

    return null;
  }

  async claimReward(claimId: string, notes?: string) {
    const claim = await this.rewardClaimsRepository.findOne({
      where: { id: claimId },
      relations: ['campaign'],
    });

    if (!claim) {
      throw new NotFoundException('Reward claim not found');
    }

    if (claim.isClaimed) {
      throw new BadRequestException('Reward has already been claimed');
    }

    claim.isClaimed = true;
    claim.claimedAt = new Date();
    claim.claimNotes = notes;

    return await this.rewardClaimsRepository.save(claim);
  }

  async getRewardClaim(claimId: string) {
    const claim = await this.rewardClaimsRepository.findOne({
      where: { id: claimId },
      relations: ['campaign'],
    });

    if (!claim) {
      throw new NotFoundException('Reward claim not found');
    }

    return claim;
  }

  async getRewardClaimsByPhone(phoneNumber: string) {
    return await this.rewardClaimsRepository.find({
      where: { phoneNumber },
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllRewardClaims() {
    return await this.rewardClaimsRepository.find({
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStationRewardClaims(stationId: string) {
    return await this.rewardClaimsRepository.find({
      where: {
        stationId: stationId,
      },
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStationRewardClaimsWithAccess(stationId: string, user: any) {
    // Check if station exists
    const station = await this.stationsRepository.findOne({
      where: { id: stationId },
    });

    if (!station) {
      throw new NotFoundException('Station not found');
    }

    // For now, allow all authenticated users to view station coupon data
    // The frontend already filters to only show assigned stations
    // If user is a manager, they should only access their assigned stations (frontend validates this)
    
    // Get all claims for this station
    return this.getStationRewardClaims(stationId);
  }

  async getClaimsSummary() {
    const allClaims = await this.rewardClaimsRepository.find({
      relations: ['campaign'],
    });

    const totalGenerated = allClaims.length;
    const totalClaimed = allClaims.filter((c) => c.isClaimed).length;
    const unclaimedCoupons = allClaims.filter((c) => !c.isClaimed).length;

    const claimsByStatus = {
      totalGenerated,
      totalClaimed,
      unclaimedCoupons,
      claimRate: totalGenerated > 0 ? ((totalClaimed / totalGenerated) * 100).toFixed(2) : 0,
    };

    const claimsByRewardType = {};
    allClaims.forEach((claim) => {
      const rewardType = claim.campaign?.rewardType || 'unknown';
      if (!claimsByRewardType[rewardType]) {
        claimsByRewardType[rewardType] = { total: 0, claimed: 0 };
      }
      claimsByRewardType[rewardType].total++;
      if (claim.isClaimed) {
        claimsByRewardType[rewardType].claimed++;
      }
    });

    return {
      summary: claimsByStatus,
      byRewardType: claimsByRewardType,
      recentClaims: allClaims.slice(0, 10),
    };
  }

  async getClaimsByStation(stationId: string) {
    const claims = await this.rewardClaimsRepository.find({
      where: { stationId },
      relations: ['campaign'],
      order: { createdAt: 'DESC' },
    });

    const totalGenerated = claims.length;
    const totalClaimed = claims.filter((c) => c.isClaimed).length;
    const unclaimedCoupons = claims.filter((c) => !c.isClaimed).length;

    return {
      stationId,
      summary: {
        totalGenerated,
        totalClaimed,
        unclaimedCoupons,
        claimRate: totalGenerated > 0 ? ((totalClaimed / totalGenerated) * 100).toFixed(2) : 0,
      },
      claims: claims,
    };
  }

  async getClaimsSummaryByStation() {
    const allClaims = await this.rewardClaimsRepository.find({
      relations: ['campaign', 'station'],
    });

    const stationMap = new Map<string, any>();

    allClaims.forEach((claim) => {
      const stationId = claim.stationId;
      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, {
          stationId,
          stationName: claim.station?.name || 'Unknown Station',
          stationCode: claim.station?.stationCode || 'N/A',
          totalGenerated: 0,
          totalClaimed: 0,
          byRewardType: {},
        });
      }

      const station = stationMap.get(stationId);
      station.totalGenerated++;
      if (claim.isClaimed) {
        station.totalClaimed++;
      }

      const rewardType = claim.campaign?.rewardType || 'unknown';
      if (!station.byRewardType[rewardType]) {
        station.byRewardType[rewardType] = { total: 0, claimed: 0 };
      }
      station.byRewardType[rewardType].total++;
      if (claim.isClaimed) {
        station.byRewardType[rewardType].claimed++;
      }
    });

    const stations = Array.from(stationMap.values()).map((s) => ({
      ...s,
      claimRate: s.totalGenerated > 0 ? ((s.totalClaimed / s.totalGenerated) * 100).toFixed(2) : 0,
    }));

    return {
      stations,
      totalGenerated: allClaims.length,
      totalClaimed: allClaims.filter((c) => c.isClaimed).length,
    };
  }

}

