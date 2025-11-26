import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Review } from './review.entity';
import { Alert } from './alert.entity';
import { StationsScorecard } from './stations-scorecard.entity';
import { User } from './user.entity';
import { AlertConfiguration } from './alert-configuration.entity';

@Entity('stations')
export class Station {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  stationCode: string;

  @Column({ type: 'uuid', nullable: true })
  regionId: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  geoLat: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  geoLng: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  contact: string;

  @Column({ type: 'uuid', nullable: true })
  managerId: string;

  @ManyToOne(() => User, (user) => user.managedStations, { nullable: true, onDelete: 'SET NULL' })
  manager: User;

  @OneToMany(() => Review, (review) => review.station)
  reviews: Review[];

  @OneToMany(() => Alert, (alert) => alert.station)
  alerts: Alert[];

  @OneToMany(() => AlertConfiguration, (config) => config.station)
  alertConfigurations: AlertConfiguration[];

  @OneToMany(() => StationsScorecard, (scorecard) => scorecard.station)
  scorecards: StationsScorecard[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
