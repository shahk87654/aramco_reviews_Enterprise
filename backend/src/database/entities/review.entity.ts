import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Station } from './station.entity';
import { User } from './user.entity';
import { ReviewMedia } from './review-media.entity';
import { Alert } from './alert.entity';

export enum ReviewStatus {
  NEW = 'new',
  IN_REVIEW = 'in_review',
  RESPONDED = 'responded',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
}

export enum ReviewCategory {
  WASHROOM = 'washroom',
  STAFF = 'staff',
  CLEANLINESS = 'cleanliness',
  FUEL_QUALITY = 'fuel_quality',
  STORE = 'store',
  CAR_WASH = 'car_wash',
  SAFETY = 'safety',
  PARKING = 'parking',
  OVERALL = 'overall',
}

export enum SentimentType {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative',
}

@Entity('reviews')
@Index(['stationId', 'createdAt'])
@Index(['rating', 'stationId'])
@Index(['sentiment'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => Station, (station) => station.reviews, { onDelete: 'CASCADE' })
  station: Station;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user: User;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'simple-array', nullable: true })
  categories: ReviewCategory[];

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  sentiment: SentimentType;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  sentimentScore: number; // 0.0 to 1.0

  @Column({ type: 'simple-array', nullable: true })
  keywords: string[];

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ type: 'varchar', length: 20, default: ReviewStatus.NEW })
  status: ReviewStatus;

  @Column({ type: 'text', nullable: true })
  managerReply: string;

  @Column({ type: 'datetime', nullable: true })
  managerReplyAt: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedByUserId: string;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @OneToMany(() => ReviewMedia, (media) => media.review, { cascade: true })
  media: ReviewMedia[];

  @OneToMany(() => Alert, (alert) => alert.review)
  alerts: Alert[];

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  geoLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  geoLng: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deviceFingerprint: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string; // Phone number for tracking visits and rewards

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName: string; // Customer name for campaign tracking

  @Column({ type: 'datetime', nullable: true })
  lastSubmissionAt: Date; // Track last submission time for cooldown

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'boolean', default: false })
  flaggedAsSpam: boolean;

  @Column({ type: 'boolean', default: false })
  flaggedForModeration: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
