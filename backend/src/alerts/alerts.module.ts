import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { Alert } from '../database/entities/alert.entity';
import { AlertConfiguration } from '../database/entities/alert-configuration.entity';
import { Review } from '../database/entities/review.entity';
import { Station } from '../database/entities/station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert, AlertConfiguration, Review, Station])],
  controllers: [AlertsController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
