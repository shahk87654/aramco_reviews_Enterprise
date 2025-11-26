import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Review } from '../database/entities/review.entity';
import { Station } from '../database/entities/station.entity';
import { Alert } from '../database/entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Station, Alert])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
