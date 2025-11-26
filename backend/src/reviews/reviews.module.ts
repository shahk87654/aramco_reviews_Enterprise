import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from '../database/entities/review.entity';
import { CampaignsModule } from '../campaigns/campaigns.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review]),
    forwardRef(() => CampaignsModule),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
