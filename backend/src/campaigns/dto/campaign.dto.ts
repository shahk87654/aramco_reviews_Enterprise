import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, Min, Length, Max } from 'class-validator';
import { RewardType, CampaignStatus } from '../../database/entities/campaign.entity';

export class CreateCampaignDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  description?: string;

  @IsNumber()
  @Min(1)
  reviewThreshold: number;

  @IsEnum(RewardType)
  rewardType: RewardType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  reviewThreshold?: number;

  @IsOptional()
  @IsEnum(RewardType)
  rewardType?: RewardType;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

