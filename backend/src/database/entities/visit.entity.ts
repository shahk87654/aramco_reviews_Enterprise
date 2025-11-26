import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Station } from './station.entity';

@Entity('visits')
@Index(['phoneNumber', 'stationId'])
@Index(['phoneNumber', 'createdAt'])
export class Visit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'uuid' })
  stationId: string;

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  station: Station;

  @Column({ type: 'uuid', nullable: true })
  reviewId: string; // If a review was submitted during this visit

  @Column({ type: 'datetime', nullable: true })
  visitDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

