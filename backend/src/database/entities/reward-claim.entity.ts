import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Campaign } from './campaign.entity';
import { Station } from './station.entity';

@Entity('reward_claims')
@Index(['phoneNumber', 'campaignId'])
@Index(['stationId', 'isClaimed'])
export class RewardClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Column({ type: 'uuid' })
  campaignId: string;

  @ManyToOne(() => Campaign, (campaign) => campaign.claims, { onDelete: 'CASCADE' })
  campaign: Campaign;

  @Column({ type: 'uuid' })
  stationId: string; // Station where review was submitted

  @ManyToOne(() => Station, { onDelete: 'CASCADE' })
  station: Station;

  @Column({ type: 'uuid', nullable: true })
  reviewId: string; // The review that triggered the reward

  @Column({ type: 'text', nullable: true })
  qrCode: string; // QR code data or URL

  @Column({ type: 'boolean', default: false })
  isClaimed: boolean;

  @Column({ type: 'datetime', nullable: true })
  claimedAt: Date;

  @Column({ type: 'text', nullable: true })
  claimNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

