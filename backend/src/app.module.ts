import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from '@database/database.module';
import { AuthModule } from '@auth/auth.module';
import { ReviewsModule } from '@reviews/reviews.module';
import { StationsModule } from '@stations/stations.module';
import { AnalyticsModule } from '@analytics/analytics.module';
import { AlertsModule } from '@alerts/alerts.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import {
  Station,
  User,
  Review,
  ReviewMedia,
  Alert,
  StationsScorecard,
  AuditLog,
  AlertConfiguration,
  Campaign,
  RewardClaim,
  Visit,
} from './database/entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    TypeOrmModule.forRoot(
      process.env.DB_TYPE === 'postgres'
        ? {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_NAME || 'aramco_reviews',
            entities: [Station, User, Review, ReviewMedia, Alert, StationsScorecard, AuditLog, AlertConfiguration, Campaign, RewardClaim, Visit],
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV === 'development',
            ssl: process.env.DB_SSL === 'true',
          }
        : {
            type: 'sqlite',
            database: process.env.DB_PATH || 'aramco_reviews.sqlite',
            entities: [Station, User, Review, ReviewMedia, Alert, StationsScorecard, AuditLog, AlertConfiguration, Campaign, RewardClaim, Visit],
            synchronize: true,
            logging: process.env.NODE_ENV === 'development',
          },
    ),
    DatabaseModule,
    AuthModule,
    ReviewsModule,
    StationsModule,
    AnalyticsModule,
    AlertsModule,
    CampaignsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
