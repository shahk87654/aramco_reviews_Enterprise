import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RewardClaim } from './reward-claim.entity';

export enum RewardType {
  DISCOUNT_10_PERCENT = 'discount_10_percent',
  FREE_TEA = 'free_tea',
  FREE_COFFEE = 'free_coffee',
}

export enum CampaignStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  reviewThreshold: number; // Number of reviews required (e.g., 5)

  @Column({ type: 'varchar', length: 50 })
  rewardType: RewardType;

  @Column({ type: 'varchar', length: 20, default: CampaignStatus.ACTIVE })
  status: CampaignStatus;

  @Column({ type: 'datetime', nullable: true })
  startDate: Date;

  @Column({ type: 'datetime', nullable: true })
  endDate: Date;

  @OneToMany(() => RewardClaim, (claim) => claim.campaign)
  claims: RewardClaim[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

