import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Station,
  User,
  Review,
  ReviewMedia,
  Alert,
  StationsScorecard,
  AuditLog,
  AlertConfiguration,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Station,
      User,
      Review,
      ReviewMedia,
      Alert,
      StationsScorecard,
      AuditLog,
      AlertConfiguration,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
