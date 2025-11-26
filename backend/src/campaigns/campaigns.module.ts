import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { Campaign } from '../database/entities/campaign.entity';
import { RewardClaim } from '../database/entities/reward-claim.entity';
import { Visit } from '../database/entities/visit.entity';
import { Review } from '../database/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Campaign, RewardClaim, Visit, Review])],
  controllers: [CampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule {}

