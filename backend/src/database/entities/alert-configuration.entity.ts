import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Station } from './station.entity';

@Entity('alert_configurations')
@Index(['stationId'], { unique: true })
export class AlertConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => Station, (station) => station.alertConfigurations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stationId' })
  station: Station;

  @Column({ type: 'boolean', default: true })
  isEnabled: boolean;

  @Column({ type: 'int', default: 3 })
  negativeRatingThreshold: number;

  @Column({ type: 'simple-array', default: '' })
  criticalKeywords: string[];

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.3 })
  spikeThresholdPercentage: number; // 30% negative in 24h

  @Column({ type: 'int', default: 24 })
  spikeLookbackHours: number;

  @Column({ type: 'int', default: 86400 })
  escalationSlaSeconds: number; // 24 hours

  @Column({ type: 'boolean', default: true })
  sentimentBasedAlerts: boolean;

  @Column({ type: 'boolean', default: true })
  spamDetectionAlerts: boolean;

  @Column({ type: 'boolean', default: true })
  emailNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  smsNotificationsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  pushNotificationsEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
