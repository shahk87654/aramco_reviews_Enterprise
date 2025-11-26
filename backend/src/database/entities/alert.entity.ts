import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Review } from './review.entity';
import { Station } from './station.entity';

export enum AlertType {
  NEGATIVE_RATING = 'negative_rating',
  KEYWORD_TRIGGER = 'keyword_trigger',
  SPIKE = 'spike',
  NEGATIVE_SENTIMENT = 'negative_sentiment',
  SPAM_DETECTED = 'spam_detected',
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

@Entity('alerts')
@Index(['stationId', 'createdAt'])
@Index(['status'])
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  reviewId: string;

  @ManyToOne(() => Review, (review) => review.alerts, { nullable: true, onDelete: 'SET NULL' })
  review: Review;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => Station, (station) => station.alerts, { onDelete: 'CASCADE' })
  station: Station;

  @Column({ type: 'varchar', length: 50 })
  type: AlertType;

  @Column({ type: 'varchar', length: 20 })
  priority: AlertPriority;

  @Column({ type: 'varchar', length: 20, default: AlertStatus.NEW })
  status: AlertStatus;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  payload: string | null;

  @Column({ type: 'uuid', nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'datetime', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'uuid', nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
