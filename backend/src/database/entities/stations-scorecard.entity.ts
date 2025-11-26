import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Station } from './station.entity';

@Entity('stations_scorecards')
export class StationsScorecard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => Station, (station) => station.scorecards, { onDelete: 'CASCADE' })
  station: Station;

  @Column({ type: 'datetime' })
  periodStart: Date;

  @Column({ type: 'datetime' })
  periodEnd: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  avgRating: number;

  @Column({ type: 'int' })
  totalReviews: number;

  @Column({ type: 'int' })
  negativeCount: number;

  @Column({ type: 'int' })
  positiveCount: number;

  @Column({ type: 'int' })
  neutralCount: number;

  @Column({ type: 'text', nullable: true })
  topComplaints: string;

  @Column({ type: 'text', nullable: true })
  topPraises: string;

  @Column({ type: 'text', nullable: true })
  aiInsights: string;

  @Column({ type: 'text', nullable: true })
  recommendations: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
